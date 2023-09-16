import type {
	ImportDeclaration,
	JSXAttrValue,
	JSXOpeningElement,
	Module,
	TsType,
} from "@swc/core";
import { parse as swcParse } from "@swc/core";
import { walk } from "astray";

import type { Parser, Primitive } from "../types";
import { getUnknownValue } from "../helpers";

type AST = {
	ImportDeclaration: ImportDeclaration;
	JSXOpeningElement: JSXOpeningElement;
	TsType: TsType;
};

export const parser: Parser = {
	id: "swc",
	async execute(source, { onAddingItem, onGettingImport, onSettingImport }) {
		const ast = await swcParse(source, {
			syntax: "typescript",
			tsx: true,
		});

		/**
		 * Traverse method using the visitor design pattern.
		 * SWC traverser (`import { Visitor } from "@swc/core/Visitor"`) is not used since it doesn't traverse recursively nodes
		 * (at least, recursive `JSXOpeningElement`s are not retrieved)
		 */
		// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
		walk<Module, void, AST>(ast, {
			ImportDeclaration(node) {
				const module = node.source.value;

				node.specifiers.forEach((specifier) => {
					const specifierValue = specifier.local.value;

					onSettingImport({
						name:
							// @ts-expect-error `imported` field is exposed by `ImportSpecifier` node (@todo: fix the typing issue in @swc/core)
							// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
							(specifier.imported?.value ||
								specifierValue) as string,
						alias: specifierValue,
						module,
					});
				});
			},
			JSXOpeningElement(node) {
				if (node.name.type !== "Identifier") return;

				const name = node.name.value;
				const importMetadata = onGettingImport(name);

				if (!importMetadata) return;

				onAddingItem({
					name: importMetadata.name,
					module: importMetadata.module,
					offset: node.span.start,
					type: "component",
					args: {
						isSpread: false,
						data: node.attributes.reduce<Record<string, unknown>>(
							(props, prop) => {
								if (
									prop.type !== "JSXAttribute" ||
									prop.name.type !== "Identifier"
								)
									return props;

								props[prop.name.value] = getLiteralValue(
									prop.value,
								);

								return props;
							},
							{},
						),
					},
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

				const importMetadata = onGettingImport(typeValue);

				if (!importMetadata) return;

				onAddingItem({
					offset: node.span.start,
					module: importMetadata.module,
					name: importMetadata.name,
					type: "type",
				});
			},
		});
	},
};

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
