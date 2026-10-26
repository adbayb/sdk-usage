import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInstance } from "@sdk-usage/core";
import { describe, expect, test } from "vitest";
import { plugin } from "./index";

describe(plugin, () => {
	test("records spread props and explicit attributes", async () => {
		const directory = await mkdtemp(join(tmpdir(), "sdk-usage-jsx-test-"));

		try {
			await mkdir(join(directory, "src"), { recursive: true });

			await writeFile(
				join(directory, "package.json"),
				JSON.stringify({ name: "fixture", version: "1.0.0" }),
			);

			await writeFile(
				join(directory, "src", "index.tsx"),
				'import { Button as UiButton } from "ui"; const props = {}; <UiButton {...props} disabled />',
			);

			const items = [];

			for await (const item of createInstance(directory, {
				includeFiles: ["**/*.tsx"],
				plugins: [plugin],
			}).getItems()) {
				items.push(item);
			}

			expect(items).toMatchObject([
				{
					name: "Button",
					input: {
						metadata: { withSpreading: true },
						data: { disabled: true },
					},
				},
			]);
		} finally {
			await rm(directory, { force: true, recursive: true });
		}
	});
});
