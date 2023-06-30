import { JSXAttrValue, Module, parse as swcParse } from "@swc/core";
import { Visitor } from "@swc/core/Visitor";
import { Item, Parser, ParserMethods, Primitive } from "../types";

export const parser: Parser = {
	id: "swc",
	async parse(source, methods) {
		const module = await swcParse(source, {
			syntax: "typescript",
			tsx: true,
		});

		const visit = createVisitor(methods);

		return visit(module);
	},
};

const createVisitor = ({ createItem, createFallbackToken }: ParserMethods) => {
	const items: Array<Item> = [];
	const visitor = new Visitor();
	const imports = new Map<string, { module: string; name: string }>();

	visitor.visitTsType = (node) => {
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

		if (!importMetadata) return node;

		items.push(
			createItem({
				offset: node.span.start,
				module: importMetadata.module,
				name: importMetadata.name,
				type: "type",
			})
		);

		return node;
	};

	visitor.visitImportDeclaration = (node) => {
		const module = node.source.value;

		node.specifiers.forEach((specifier) => {
			const specifierValue = specifier.local.value;

			imports.set(specifierValue, {
				// @ts-expect-error `imported` field is exposed by `ImportSpecifier` node (@todo: fix the typing issue in @swc/core)
				name: specifier.imported?.value || specifierValue,
				module,
			});
		});

		return node;
	};

	visitor.visitJSXOpeningElement = (node) => {
		if (node.name.type !== "Identifier") return node;

		const name = node.name.value;
		const importMetadata = imports.get(name);

		if (!importMetadata) return node;

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

		return node;
	};

	return function visit(module: Module) {
		visitor.visitModule(module);

		return items;
	};
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
