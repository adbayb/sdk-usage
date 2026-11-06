import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInstance } from "@sdk-usage/core";
import { describe, expect, test } from "vitest";
import { plugin } from "./plugin";

describe(plugin, () => {
	test("should collect imported, qualified, and inline types once per reference", async () => {
		const directory = await mkdtemp(join(tmpdir(), "sdk-usage-typescript-test-"));

		try {
			await mkdir(join(directory, "src"), { recursive: true });

			await writeFile(
				join(directory, "package.json"),
				JSON.stringify({ name: "fixture", version: "1.0.0" }),
			);

			await writeFile(
				join(directory, "src", "index.ts"),
				[
					'import { ButtonProps as Props } from "ui";',
					'import * as UI from "ui";',
					"type Imported = Props;",
					"type Qualified = UI.ButtonProps;",
					'type Inline = import("ui").ButtonProps;',
					'type NestedInline = import("ui").Components.ButtonProps;',
					'type Indexed = Props["label"];',
					"interface ExtendsNamed extends Props {}",
					"interface ExtendsNamespace extends UI.ButtonProps {}",
					"type QueryNamed = typeof Props;",
					"type QueryNamespace = typeof UI.Button;",
					"type LocalShadow<Props> = Props;",
					"type Local = string;",
				].join("\n"),
			);

			const items = await Array.fromAsync(
				createInstance(directory, { plugins: [plugin] }).getItems(),
			);

			expect(
				items.map(({ name, module, type }) => {
					return { name, module, type };
				}),
			).toStrictEqual([
				...Array.from({ length: 8 }, () => {
					return { name: "ButtonProps", module: "ui", type: "typescript/type" };
				}),
				{ name: "Button", module: "ui", type: "typescript/type" },
			]);
		} finally {
			await rm(directory, { force: true, recursive: true });
		}
	});
});
