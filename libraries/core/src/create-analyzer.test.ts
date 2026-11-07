import { execFileSync } from "node:child_process";
import type { Dir } from "node:fs";
import { mkdtemp, mkdir, opendir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { getDefaultHighWaterMark } from "node:stream";
import { setImmediate } from "node:timers/promises";
import { afterEach, describe, expect, test, vi } from "vitest";
import { createAnalyzer } from "./create-analyzer";
import type { Plugin } from "./modules/plugin";
import type { AstNodes } from "./types";

vi.mock(import("node:fs/promises"), { spy: true });

const MAXIMUM_READ_AHEAD = getDefaultHighWaterMark(true);
const pluginFailure = new Error("Plugin failed");
const temporaryDirectories: string[] = [];

const visitElement = vi.fn((node: AstNodes["JSXOpeningElement"]) => {
	return { name: "Button", module: "ui", offset: node.span.start, type: "test" };
});

const usagePlugin: Plugin = () => {
	return { JSXOpeningElement: visitElement };
};

const failingPlugin: Plugin = () => {
	return {
		JSXOpeningElement() {
			throw pluginFailure;
		},
	};
};

describe(createAnalyzer, () => {
	afterEach(async () => {
		vi.resetAllMocks();

		await Promise.all(
			temporaryDirectories.splice(0).map(async (directory) => {
				return rm(directory, { force: true, recursive: true });
			}),
		);
	});

	test("should apply file and folder filters and resolve versions per nested package", async () => {
		const root = await createPackageDirectory();

		await createSourceFile(root, "src/main.tsx");
		await createSourceFile(root, "src/not-included.jsx");
		await createSourceFile(root, "ignored/main.tsx");
		await createSourceFile(root, "packages/nested/src/main.tsx");

		await writeFile(
			join(root, "packages/nested/package.json"),
			JSON.stringify({ name: "nested-fixture", dependencies: { ui: "^2.0.0" } }),
		);

		const items = await Array.fromAsync(
			createAnalyzer(root, {
				excludeFolders: ["ignored"],
				includeFiles: ["**/*.tsx"],
				plugins: [usagePlugin],
			}).getItems(),
		);

		expect(
			items
				.map(({ location, version }) => {
					return `${location.module}@${version} ${location.file}:${location.line}:${location.column}`;
				})
				.toSorted(),
		).toStrictEqual([
			"fixture@^1.0.0 ./src/main.tsx:1:44",
			"nested-fixture@^2.0.0 ./packages/nested/src/main.tsx:1:44",
		]);
	});

	test("should use the package's repository remote in source locations", async () => {
		const root = await createPackageDirectory();
		const repositoryUrl = "https://example.com/fixture.git";

		execFileSync("git", ["init", "--quiet"], { cwd: root });
		execFileSync("git", ["remote", "add", "origin", repositoryUrl], { cwd: root });
		await createSourceFile(root, "src/main.tsx");

		const [item] = await Array.fromAsync(
			createAnalyzer(root, { plugins: [usagePlugin] }).getItems(),
		);

		expect(item?.location.link).toBe(repositoryUrl);
	});

	test.each<{ expected: string[]; includeFiles?: string[] }>([
		{ expected: ["./main.tsx", "./src/main.jsx", "./src/main.tsx"] },
		{
			expected: ["./main.tsx", "./src/main.jsx", "./src/main.test.tsx", "./src/main.tsx"],
			includeFiles: ["**/*.{jsx,tsx}"],
		},
		{
			expected: ["./main.tsx", "./src/main.tsx"],
			includeFiles: ["**/!(main.test).tsx"],
		},
		{
			expected: ["./.hidden/main.tsx", "./src/.hidden.tsx"],
			includeFiles: ["**/.*.tsx", "**/.hidden/**/*.tsx"],
		},
		{ expected: [], includeFiles: ["!**/*.tsx"] },
		{ expected: [], includeFiles: [] },
	])("should match file patterns $includeFiles", async ({ expected, ...options }) => {
		const root = await createPackageDirectory();

		for (const file of [
			"main.tsx",
			"src/main.tsx",
			"src/main.jsx",
			"src/main.test.tsx",
			"src/.hidden.tsx",
			".hidden/main.tsx",
			"node_modules/ui/main.tsx",
		]) {
			await createSourceFile(root, file);
		}

		const items = await Array.fromAsync(
			createAnalyzer(root, { ...options, plugins: [usagePlugin] }).getItems(),
		);

		expect(
			items
				.map(({ location }) => {
					return location.file;
				})
				.toSorted(),
		).toStrictEqual(expected);
	});

	test("should not access files before consumption", async () => {
		const root = await createPackageDirectory();
		const items = createAnalyzer(root, { plugins: [usagePlugin] }).getItems();

		await setImmediate();
		expect(readFile).not.toHaveBeenCalled();
		await items[Symbol.asyncIterator]().return?.();
	});

	test("should return no usages when package metadata is missing", async () => {
		const root = await createPackageDirectory();

		await rm(join(root, "package.json"));
		await createSourceFile(root, "src/main.tsx");

		await expect(
			Array.fromAsync(createAnalyzer(root, { plugins: [usagePlugin] }).getItems()),
		).resolves.toStrictEqual([]);
	});

	test("should report a missing source file and close directory handles", async () => {
		const root = await createPackageDirectory();
		const missingFile = join(root, "missing.tsx");
		const sourceFile = join(root, "main.tsx");

		await symlink(missingFile, sourceFile);

		await expect(
			Array.fromAsync(
				createAnalyzer(root, {
					includeFiles: ["**/*.tsx"],
					plugins: [usagePlugin],
				}).getItems(),
			),
		).rejects.toMatchObject({ code: "ENOENT", path: sourceFile });

		for (const { value } of vi.mocked(opendir).mock.results) {
			await expectClosed(await (value as Promise<Dir>));
		}
	});

	test("should bound read-ahead and stop visiting nodes after iterator return", async () => {
		const root = await createPackageDirectory();

		await createSourceFile(root, "src/main.tsx", "<Button />".repeat(1000));

		const items = createAnalyzer(root, {
			includeFiles: ["**/*.tsx"],
			plugins: [usagePlugin],
		}).getItems();

		await items[Symbol.asyncIterator]().next();
		await setImmediate();

		const visitedWhilePaused = visitElement.mock.calls.length;

		expect(visitedWhilePaused).toBeLessThanOrEqual(MAXIMUM_READ_AHEAD);
		await items[Symbol.asyncIterator]().return?.();
		await setImmediate();
		expect(visitElement).toHaveBeenCalledTimes(visitedWhilePaused);
	});

	test("should stop a pending scan and close a directory opened during iterator return", async () => {
		const root = await createPackageDirectory();

		for (let index = 0; index < 100; index += 1) {
			await mkdir(join(root, String(index)));
		}

		const { opendir: openDirectory } = await vi.importActual<{ opendir: typeof opendir }>(
			"node:fs/promises",
		);

		const opened = Promise.withResolvers<Dir>();
		const release = Promise.withResolvers<undefined>();

		vi.mocked(opendir).mockImplementationOnce(async (...parameters) => {
			const directory = await openDirectory(...parameters);

			opened.resolve(directory);
			await release.promise;

			return directory;
		});

		// Nothing matches, so without cancellation the pending read would traverse every directory.
		const items = createAnalyzer(root, {}).getItems();
		const pendingRead = Promise.allSettled([items[Symbol.asyncIterator]().next()]);
		const directory = await opened.promise;
		const returned = items[Symbol.asyncIterator]().return?.();

		release.resolve(undefined);
		await Promise.all([returned, pendingRead]);
		await expectClosed(directory);
		expect(vi.mocked(readFile).mock.calls.length).toBeLessThanOrEqual(MAXIMUM_READ_AHEAD);
	});

	test.each([
		{
			name: "early iterator return",
			consume: async (items: AsyncIterable<unknown>) => {
				const iterator = items[Symbol.asyncIterator]();

				await iterator.next();
				await iterator.return?.();
			},
			plugin: usagePlugin,
		},
		{
			name: "plugin error",
			consume: async (items: AsyncIterable<unknown>) => {
				await expect(Array.fromAsync(items)).rejects.toBe(pluginFailure);
			},
			plugin: failingPlugin,
		},
	])("should close directory handles on $name", async ({ consume, plugin }) => {
		const root = await createPackageDirectory();

		for (let index = 0; index < 100; index += 1) {
			await createSourceFile(root, `src/${index}.tsx`);
		}

		await consume(
			createAnalyzer(root, { includeFiles: ["**/*.tsx"], plugins: [plugin] }).getItems(),
		);

		const directories = await Promise.all(
			vi.mocked(opendir).mock.results.map(async ({ value }) => {
				return value as Promise<Dir>;
			}),
		);

		expect(directories.length).toBeGreaterThan(0);

		await Promise.all(
			directories.map(async (directory) => {
				return expectClosed(directory);
			}),
		);

		expect(vi.mocked(readFile).mock.calls.length).toBeLessThanOrEqual(MAXIMUM_READ_AHEAD);
	});
});

const expectClosed = async (directory: Dir) => {
	// Stream cleanup closes directories asynchronously after the consumer has finished.
	await vi.waitFor(async () => {
		await expect(directory.read()).rejects.toHaveProperty("code", "ERR_DIR_CLOSED");
	});
};

const createPackageDirectory = async () => {
	const directory = await mkdtemp(join(tmpdir(), "sdk-usage-test-"));

	temporaryDirectories.push(directory);

	await writeFile(
		join(directory, "package.json"),
		JSON.stringify({ name: "fixture", dependencies: { ui: "^1.0.0" }, version: "1.0.0" }),
	);

	return directory;
};

const createSourceFile = async (root: string, filePath: string, jsx = "<Button />") => {
	await mkdir(dirname(join(root, filePath)), { recursive: true });
	await writeFile(join(root, filePath), `import { Button } from "ui"; const view = <>${jsx}</>;`);
};
