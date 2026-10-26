import { once } from "node:events";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { createInstance } from "./create-instance";
import type { Plugin } from "./modules/plugin";

const temporaryDirectories: string[] = [];

const usagePlugin: Plugin = () => {
	return {
		JSXOpeningElement(node) {
			return {
				name: "Button",
				module: "ui",
				offset: node.span.start,
				type: "test",
			};
		},
	};
};

describe(createInstance, () => {
	afterEach(async () => {
		await Promise.all(
			temporaryDirectories.splice(0).map(async (directory) => {
				return rm(directory, {
					force: true,
					recursive: true,
				});
			}),
		);
	});

	test("applies file and folder filters and does not duplicate nested package files", async () => {
		const root = await createPackageDirectory();

		await createSourceFile(root, "src/main.tsx");
		await createSourceFile(root, "src/not-included.jsx");
		await createSourceFile(root, "ignored/main.tsx");
		await createSourceFile(root, "packages/nested/src/main.tsx", true);

		const items = [];

		for await (const item of createInstance(root, {
			excludeFolders: ["ignored"],
			includeFiles: ["**/*.tsx"],
			plugins: [usagePlugin],
		}).getItems()) {
			items.push(item);
		}

		expect(items).toHaveLength(2);

		expect(
			items
				.map((item) => {
					return item.location.file;
				})
				.toSorted(),
		).toStrictEqual(["./packages/nested/src/main.tsx", "./src/main.tsx"]);
	});

	test("streams results one at a time and stops parsing when iteration ends", async () => {
		const root = await createPackageDirectory();

		await mkdir(join(root, "src"), { recursive: true });

		const repeatedUsages = "<Button />".repeat(1000);

		await writeFile(
			join(root, "src", "main.tsx"),
			`import { Button } from "ui"; const view = <>${repeatedUsages}</>;`,
		);

		let visited = 0;

		const countingPlugin: Plugin = () => {
			return {
				JSXOpeningElement(node) {
					visited += 1;

					return {
						name: "Button",
						module: "ui",
						offset: node.span.start,
						type: "test",
					};
				},
			};
		};

		const items = createInstance(root, {
			includeFiles: ["**/*.tsx"],
			plugins: [countingPlugin],
		}).getItems();

		const firstItem = await items[Symbol.asyncIterator]().next();

		expect(firstItem.done).toBe(false);
		expect(visited).toBeLessThanOrEqual(items.readableHighWaterMark * 3);
		expect(items.readableLength).toBeLessThanOrEqual(items.readableHighWaterMark);

		const visitedBeforeCancel = visited;
		const closed = once(items, "close");

		items.destroy();
		await closed;
		expect(visited).toBe(visitedBeforeCancel);
	});

	test("streams results from source files larger than the former scan limit", async () => {
		const root = await createPackageDirectory();

		await mkdir(join(root, "src"), { recursive: true });

		await writeFile(
			join(root, "src", "large.tsx"),
			`${" ".repeat(2 * 1024 * 1024 + 1)}import { Button } from "ui"; <Button />`,
		);

		const items = createInstance(root, {
			includeFiles: ["**/*.tsx"],
			plugins: [usagePlugin],
		}).getItems();

		const firstItem = await items[Symbol.asyncIterator]().next();

		expect(firstItem.done).toBe(false);

		const closed = once(items, "close");

		items.destroy();
		await closed;
	});
});

const createPackageDirectory = async () => {
	const directory = await mkdtemp(join(tmpdir(), "sdk-usage-test-"));

	temporaryDirectories.push(directory);

	await writeFile(
		join(directory, "package.json"),
		JSON.stringify({ name: "fixture", version: "1.0.0" }),
	);

	return directory;
};

const createSourceFile = async (root: string, filePath: string, nestedPackage = false) => {
	const sourceDirectory = dirname(join(root, filePath));

	await mkdir(sourceDirectory, { recursive: true });

	if (nestedPackage) {
		const packageDirectory = join(root, "packages", "nested");

		await writeFile(
			join(packageDirectory, "package.json"),
			JSON.stringify({ name: "nested-fixture", version: "1.0.0" }),
		);
	}

	await writeFile(join(root, filePath), 'import { Button } from "ui"; const view = <Button />;');
};
