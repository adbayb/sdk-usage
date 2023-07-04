import {
	ImportDeclaration,
	JSXAttrValue,
	JSXOpeningElement,
	Module,
	TsType,
	parse as swcParse,
} from "@swc/core";
import { walk } from "astray";
import { Item, Parser, ParserMethods, Primitive } from "./types";

export const parser: Parser = {
	id: "swc",
	async parse(source, methods) {
		const ast = await swcParse(source, {
			syntax: "typescript",
			tsx: true,
		});

		return visit(ast, methods);
	},
};

interface AST {
	ImportDeclaration: ImportDeclaration;
	JSXOpeningElement: JSXOpeningElement;
	TsType: TsType;
}

/**
 * Traverse method using the visitor design pattern.
 * SWC traverser (`import { Visitor } from "@swc/core/Visitor"`) is not used since it doesn't traverse recursively nodes
 * (at least, recursive `JSXOpeningElement`s are not retrieved)
 * @param module The AST
 * @param methods Shared parser helpers
 * @returns Transformed items
 */
const visit = (
	module: Module,
	{ createItem, createFallbackToken }: ParserMethods
) => {
	const items: Array<Item> = [];
	const imports = new Map<string, { module: string; name: string }>();

	walk<Module, void, AST>(module, {
		ImportDeclaration(node) {
			const module = node.source.value;

			node.specifiers.forEach((specifier) => {
				const specifierValue = specifier.local.value;

				imports.set(specifierValue, {
					// @ts-expect-error `imported` field is exposed by `ImportSpecifier` node (@todo: fix the typing issue in @swc/core)
					name: specifier.imported?.value || specifierValue,
					module,
				});
			});
		},
		JSXOpeningElement(node) {
			if (node.name.type !== "Identifier") return;

			const name = node.name.value;
			const importMetadata = imports.get(name);

			if (!importMetadata) return;

			items.push(
				createItem({
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
									{ createFallbackToken }
								);

								return props;
							},
							{}
						),
					},
				})
			);
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

			items.push(
				createItem({
					offset: node.span.start,
					module: importMetadata.module,
					name: importMetadata.name,
					type: "type",
				})
			);
		},
	});

	return items;
};

const getLiteralValue = (
	node: JSXAttrValue | undefined,
	methods: Pick<ParserMethods, "createFallbackToken">
): Primitive => {
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
		return getLiteralValue(node.expression as JSXAttrValue, methods);
	}

	return methods.createFallbackToken(node.type);
};
