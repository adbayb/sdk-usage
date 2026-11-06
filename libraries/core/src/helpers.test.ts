import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { resolvePackageJson } from "./helpers";

const temporaryDirectories: string[] = [];

describe(resolvePackageJson, () => {
	afterEach(async () => {
		await Promise.all(
			temporaryDirectories.splice(0).map(async (directory) => {
				return rm(directory, { force: true, recursive: true });
			}),
		);
	});

	test("should resolve the nearest package metadata from a nested directory", async () => {
		const root = await mkdtemp(join(tmpdir(), "sdk-usage-resolve-test-"));

		temporaryDirectories.push(root);

		const nestedPackage = join(root, "nested");
		const source = join(nestedPackage, "src");

		await mkdir(source, { recursive: true });
		await writeFile(join(root, "package.json"), "{}");
		await writeFile(join(nestedPackage, "package.json"), "{}");
		expect(resolvePackageJson(source)).toBe(join(nestedPackage, "package.json"));
		expect(resolvePackageJson(nestedPackage)).toBe(join(nestedPackage, "package.json"));
	});
});
