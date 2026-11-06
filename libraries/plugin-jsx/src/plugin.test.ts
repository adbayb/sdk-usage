import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInstance } from "@sdk-usage/core";
import { describe, expect, test } from "vitest";
import { plugin } from "./plugin";

describe(plugin, () => {
	test("should collect imported JSX tags and preserve typed expression tokens", async () => {
		const directory = await mkdtemp(join(tmpdir(), "sdk-usage-jsx-test-"));

		try {
			await mkdir(join(directory, "src"), { recursive: true });

			await writeFile(
				join(directory, "package.json"),
				JSON.stringify({ name: "fixture", version: "1.0.0" }),
			);

			await writeFile(
				join(directory, "src", "index.tsx"),
				[
					'import { Button as UiButton } from "ui";',
					'import * as UI from "ui";',
					'import type { TypeOnly } from "ui";',
					'const props = {}; <UiButton {...props} disabled run={() => {}} marker="#ArrowFunctionExpression" />;',
					"<UI.Form.Link />;",
					'<UI:Button data:kind="primary" />;',
					"function shadowed(UiButton: unknown) { return <UiButton />; }",
					"<TypeOnly />;",
				].join("\n"),
			);

			const items = await Array.fromAsync(
				createInstance(directory, {
					includeFiles: ["**/*.tsx"],
					plugins: [plugin],
				}).getItems(),
			);

			expect(items).toMatchObject([
				{
					name: "Button",
					input: {
						metadata: { withSpreading: true },
						data: {
							disabled: true,
							marker: "#ArrowFunctionExpression",
							run: {
								syntax: "ArrowFunctionExpression",
								type: "unsupported-syntax",
							},
						},
					},
				},
				{
					name: "Link",
					module: "ui",
					type: "jsx/element",
				},
				{
					name: "Button",
					input: { data: { "data:kind": "primary" } },
					module: "ui",
					type: "jsx/element",
				},
			]);
		} finally {
			await rm(directory, { force: true, recursive: true });
		}
	});
});
