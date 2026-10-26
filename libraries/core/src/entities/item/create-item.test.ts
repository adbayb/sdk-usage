import { describe, expect, test } from "vitest";
import type { Item } from "./create-item";
import { createItem } from "./create-item";

describe(createItem, () => {
	test.each<{ expected: Item["input"]; options: Partial<Pick<Item, "input">> }>([
		{ expected: { metadata: { withSpreading: false }, data: {} }, options: {} },
		{
			expected: { metadata: { withSpreading: true }, data: { disabled: true } },
			options: { input: { metadata: { withSpreading: true }, data: { disabled: true } } },
		},
	])("defaults missing input and preserves supplied input: $options", ({ expected, options }) => {
		const item = createItem({
			name: "Button",
			...options,
			location: { column: 0, file: "./main.tsx", line: 1, link: "", module: "fixture" },
			module: "ui",
			type: "jsx/element",
			version: "^1.0.0",
		});

		expect(item.input).toStrictEqual(expected);
	});
});
