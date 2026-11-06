import { describe, expect, test } from "vitest";
import type { Plugin } from "../plugin";
import { parse } from "./parse";

const importPlugin: Plugin = (input) => {
	return {
		ImportDeclaration(node) {
			const imported = input.imports.get(node.specifiers[0]?.local.value ?? "");

			return {
				name: imported?.name ?? "",
				module: imported?.module ?? "",
				offset: node.span.start,
				type: "test",
			};
		},
	};
};

const emptyPlugin: Plugin = () => {
	return {
		JSXOpeningElement() {
			return undefined;
		},
	};
};

describe(parse, () => {
	test("should map a named import with no imported alias to its local name", async () => {
		const items = await parse('import { Button } from "ui";', {
			file: "fixture.tsx",
			plugins: [importPlugin],
		});

		expect([...items]).toMatchObject([{ name: "Button", module: "ui", type: "test" }]);
	});

	test("should preserve depth-first output and plugin order while skipping empty outputs", async () => {
		const items = await parse("const view = <Parent><Child /></Parent>;", {
			file: "fixture.tsx",
			plugins: [createOrderedPlugin("first"), emptyPlugin, createOrderedPlugin("last")],
		});

		expect(
			items
				.map(({ name, type }) => {
					return [name, type];
				})
				.toArray(),
		).toStrictEqual([
			["Parent", "first"],
			["Parent", "last"],
			["Child", "first"],
			["Child", "last"],
		]);
	});

	test("should report 0-based byte offsets", async () => {
		const code = 'const face = "😀"; <Button />';
		const prefix = code.slice(0, code.indexOf("<Button"));

		const [item] = await parse(code, {
			file: "fixture.tsx",
			plugins: [createOrderedPlugin("")],
		});

		expect(item?.offset).toBe(Buffer.byteLength(prefix));
	});

	test("should include the source file path when parsing fails", async () => {
		const parsing = parse("const = ;", { file: "fixture.tsx", plugins: [] });

		await expect(parsing).rejects.toMatchObject({
			cause: {},
			message: "Failed to parse source file: fixture.tsx",
		});
	});
});

const createOrderedPlugin = (type: string): Plugin => {
	return () => {
		return {
			JSXOpeningElement(node) {
				return {
					name: node.name.type === "Identifier" ? node.name.value : "",
					module: "ui",
					offset: node.span.start,
					type,
				};
			},
		};
	};
};
