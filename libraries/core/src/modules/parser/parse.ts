import { visit } from "@open-vanilla/visitor";
import type { Module } from "@swc/core";
import { parse as swcParse } from "@swc/core";
import type { ItemDTO } from "../../entities/item";
import type { Import, Nodes, Primitive } from "../../types";
import type { Plugin } from "../plugin";

export type ParseOptions = {
	onAdd: (item: ItemDTO) => void;
	plugins: Plugin[];
};

export const parse = async (code: string, { onAdd, plugins }: ParseOptions) => {
	const context = {
		imports: new Map<Import["alias"], Import>(),
	};

	let ast: Module | undefined;

	try {
		ast = await swcParse(code, {
			syntax: "typescript",
			tsx: true,
		});
	} catch {
		ast = undefined;
		// TODO: log error with file path
	}

	if (ast === undefined) {
		return;
	}

	const visitor: {
		[Key in keyof Nodes]?: VisitorFunction<Key>;
	} = {
		ImportDeclaration(node) {
			const module = node.source.value;

			node.specifiers.forEach((specifier) => {
				const specifierValue = specifier.local.value;

				context.imports.set(specifierValue, {
					name: "imported" in specifier ? specifier.imported.value : specifierValue,
					alias: specifierValue,
					module,
				});
			});
		},
	};

	for (const plugin of plugins) {
		const pluginOutput = plugin(context, {
			getJSXAttributeValue,
		});

		const nodeKeys = Object.keys(pluginOutput) as (keyof typeof pluginOutput)[];

		for (const nodeKey of nodeKeys) {
			const currentVisitorFunction = visitor[nodeKey] as undefined | VisitorFunction;

			visitor[nodeKey] = (node) => {
				if (typeof currentVisitorFunction === "function") {
					currentVisitorFunction(node);
				}

				const output = pluginOutput[nodeKey]?.(node as never);

				if (output) {
					onAdd(output);
				}
			};
		}
	}

	visit<Nodes>(ast, visitor);
};

type VisitorFunction<Key extends keyof Nodes = keyof Nodes> = (node: Nodes[Key]) => void;

const getJSXAttributeValue = (
	node: Nodes["JSXAttrValue"] | Nodes["JSXExpression"] | undefined,
	// eslint-disable-next-line sonarjs/cyclomatic-complexity
): Primitive => {
	if (!node) {
		return true;
	}

	if (
		node.type === "BigIntLiteral" ||
		node.type === "BooleanLiteral" ||
		node.type === "JSXText" ||
		node.type === "NumericLiteral" ||
		node.type === "StringLiteral"
	) {
		return node.value;
	}

	if (node.type === "JSXExpressionContainer") {
		return getJSXAttributeValue(node.expression);
	}

	if (node.type === "NullLiteral") {
		return;
	}

	return createUnknownToken(node.type);
};

/**
 * Helper to unify the way unknown AST token are managed.
 *
 * @example
 * 	createUnknownToken("VariableDeclaration");
 *
 * @param token - AST token value.
 * @returns Formatted AST token.
 */
const createUnknownToken = (token: string) => {
	return `#${token}`;
};
