import { describe, expect, test, vi } from "vitest";
import { plugin } from "./index";

describe(plugin, () => {
	test.each(["Button", "UiButton"])("collects imported type reference %s", (alias) => {
		const { TsType: visitType } = plugin(
			{ imports: new Map([[alias, { name: "Button", alias, module: "ui" }]]) },
			{ getJSXAttributeValue: vi.fn() },
		);

		expect(
			visitType?.({
				span: { ctxt: 0, end: 20, start: 10 },
				type: "TsTypeReference",
				typeName: {
					optional: false,
					span: { ctxt: 0, end: 20, start: 10 },
					type: "Identifier",
					value: alias,
				},
			}),
		).toStrictEqual({ name: "Button", module: "ui", offset: 10, type: "typescript/type" });
	});

	test("collects indexed-access types from their imported object type", () => {
		const { TsType: visitType } = plugin(
			{
				imports: new Map([
					["Props", { name: "ButtonProps", alias: "Props", module: "ui" }],
				]),
			},
			{ getJSXAttributeValue: vi.fn() },
		);

		expect(
			visitType?.({
				indexType: {
					kind: "string",
					span: { ctxt: 0, end: 22, start: 16 },
					type: "TsKeywordType",
				},
				objectType: {
					span: { ctxt: 0, end: 15, start: 10 },
					type: "TsTypeReference",
					typeName: {
						optional: false,
						span: { ctxt: 0, end: 15, start: 10 },
						type: "Identifier",
						value: "Props",
					},
				},
				readonly: false,
				span: { ctxt: 0, end: 30, start: 10 },
				type: "TsIndexedAccessType",
			}),
		).toStrictEqual({
			name: "ButtonProps",
			module: "ui",
			offset: 10,
			type: "typescript/type",
		});
	});

	test("ignores local types and primitive types", () => {
		const { TsType: visitType } = plugin(
			{ imports: new Map() },
			{ getJSXAttributeValue: vi.fn() },
		);

		expect(
			visitType?.({
				span: { ctxt: 0, end: 20, start: 10 },
				type: "TsTypeReference",
				typeName: {
					optional: false,
					span: { ctxt: 0, end: 20, start: 10 },
					type: "Identifier",
					value: "Local",
				},
			}),
		).toBeUndefined();

		expect(
			visitType?.({
				kind: "string",
				span: { ctxt: 0, end: 20, start: 10 },
				type: "TsKeywordType",
			}),
		).toBeUndefined();
	});
});
