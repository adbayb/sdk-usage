import { describe, expect, test } from "vitest";
import type { Plugin } from "../plugin";
import { parse } from "./parse";

const importPlugin: Plugin = (context) => {
	return {
		ImportDeclaration(node) {
			const imported = context.imports.get(node.specifiers[0]?.local.value ?? "");

			return {
				name: imported?.name ?? "",
				module: imported?.module ?? "",
				offset: node.span.start,
				type: "test",
			};
		},
	};
};

describe(parse, () => {
	test("maps a named import with no imported alias to its local name", async () => {
		const items = [];

		for await (const item of parse('import { Button } from "ui";', {
			file: "fixture.tsx",
			plugins: [importPlugin],
		})) {
			items.push(item);
		}

		expect(items).toMatchObject([
			{
				name: "Button",
				module: "ui",
				type: "test",
			},
		]);
	});

	test("includes the source file path when parsing fails", async () => {
		const items = parse("const = ;", {
			file: "fixture.tsx",
			plugins: [],
		});

		const iterator = items[Symbol.asyncIterator]();

		const parseError = await iterator.next().then(
			() => {
				return undefined;
			},
			(error: unknown) => {
				return error;
			},
		);

		expect(parseError).toHaveProperty("cause");
		expect(parseError).toHaveProperty("message", "Failed to parse source file: fixture.tsx");
	});
});
