import { parse as swcParse } from "@swc/core";
import type {
	ImportDeclaration,
	JSXAttrValue,
	JSXOpeningElement,
	Module,
	TsType,
} from "@swc/core";

import type { Import, Primitive } from "../../types";
import type { Item } from "../item";

import { traverse } from "./traverse";

type AddCallback = (
	item: Partial<Pick<Item, "data" | "metadata">> &
		Pick<Item, "module" | "name" | "type"> & {
			offset: number;
		},
) => void;

export const parse = async (code: string, addCallback: AddCallback) => {
	const imports = new Map<Import["alias"], Import>();

	const ast = await swcParse(code, {
		syntax: "typescript",
		tsx: true,
	});

	/**
	 * Traverse method using the visitor design pattern.
	 * SWC traverser (`import { Visitor } from "@swc/core/Visitor"`) is not used since it is deprecated
	 * and doesn't traverse recursively nodes (at least, recursive `JSXOpeningElement`s are not retrieved)
	 */
	traverse<Module, AST>(ast, {
		ImportDeclaration(node) {
			const module = node.source.value;

			node.specifiers.forEach((specifier) => {
				const specifierValue = specifier.local.value;

				imports.set(specifierValue, {
					name:
						// @ts-expect-error `imported` field is exposed by `ImportSpecifier` node (@todo: fix the typing issue in @swc/core)
						// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
						(specifier.imported?.value || specifierValue) as string,
					alias: specifierValue,
					module,
				});
			});
		},
		JSXOpeningElement(node) {
			if (node.name.type !== "Identifier") return;

			const name = node.name.value;
			const importMetadata = imports.get(name);

			if (!importMetadata) return;

			addCallback({
				name: importMetadata.name,
				data: node.attributes.reduce<Record<string, unknown>>(
					(props, prop) => {
						if (
							prop.type !== "JSXAttribute" ||
							prop.name.type !== "Identifier"
						)
							return props;

						props[prop.name.value] = getLiteralValue(prop.value);

						return props;
					},
					{},
				),
				module: importMetadata.module,
				offset: node.span.start,
				type: "component",
			});
		},
		TsType(node) {
			let typeValue = "";

			if (
				node.type === "TsTypeReference" &&
				node.typeName.type === "Identifier"
			) {
				typeValue = node.typeName.value;
			}

			if (
				node.type === "TsIndexedAccessType" &&
				node.objectType.type === "TsTypeReference" &&
				node.objectType.typeName.type === "Identifier"
			) {
				typeValue = node.objectType.typeName.value;
			}

			const importMetadata = imports.get(typeValue);

			if (!importMetadata) return;

			addCallback({
				name: importMetadata.name,
				module: importMetadata.module,
				offset: node.span.start,
				type: "type",
			});
		},
	});
};

type AST = {
	ImportDeclaration: ImportDeclaration;
	JSXOpeningElement: JSXOpeningElement;
	TsType: TsType;
};

/**
 * Helper to unify the way unknown AST token are persisted
 * @param token AST token value
 * @returns Formatted AST token
 */
const getUnknownValue = (token: string) => `#${token}`;

const getLiteralValue = (node: JSXAttrValue | undefined): Primitive => {
	if (!node) {
		return true;
	}

	if (node.type === "NullLiteral") {
		return null;
	}

	if (
		node.type === "StringLiteral" ||
		node.type === "NumericLiteral" ||
		node.type === "BigIntLiteral" ||
		node.type === "BooleanLiteral" ||
		node.type === "JSXText"
	) {
		return node.value;
	}

	if (node.type === "JSXExpressionContainer") {
		return getLiteralValue(node.expression as JSXAttrValue);
	}

	return getUnknownValue(node.type);
};
