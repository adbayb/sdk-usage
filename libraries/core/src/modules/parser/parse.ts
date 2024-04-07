import { parse as swcParse } from "@swc/core";
import type { Module } from "@swc/core";
import { visit } from "esvisitor";

import type { Import, Nodes, Primitive } from "../../types";
import type { Plugin, PluginOutput } from "../plugin";

export type ParseOptions = {
	onAdd: (item: PluginOutput) => void;
	/**
	 * A list of plugins to enable.
	 */
	plugins: Plugin[];
};

export const parse = async (code: string, { onAdd, plugins }: ParseOptions) => {
	const context = {
		imports: new Map<Import["alias"], Import>(),
	};

	let ast: Module | null;

	try {
		ast = await swcParse(code, {
			syntax: "typescript",
			tsx: true,
		});
	} catch (error) {
		ast = null;
		// @todo: log error with file path
	}

	if (ast === null) return;

	const visitor: {
		[Key in keyof Nodes]?: VisitorFunction<Key>;
	} = {
		ImportDeclaration(node) {
			const module = node.source.value;

			node.specifiers.forEach((specifier) => {
				const specifierValue = specifier.local.value;

				context.imports.set(specifierValue, {
					name:
						// @ts-expect-error `imported` field is exposed by `ImportSpecifier` node (@todo: fix the typing issue in @swc/core)
						// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
						(specifier.imported?.value || specifierValue) as string,
					alias: specifierValue,
					module,
				});
			});
		},
	};

	for (const plugin of plugins) {
		const pluginOutput = plugin(context, {
			getJSXAttributeValue,
		}) as Record<
			keyof Nodes,
			(node: Nodes[keyof Nodes]) => PluginOutput | undefined
		>;

		const nodeKeys = Object.keys(
			pluginOutput,
		) as (keyof typeof pluginOutput)[];

		for (const nodeKey of nodeKeys) {
			const currentVisitorFn = visitor[nodeKey] as
				| VisitorFunction
				| undefined;

			visitor[nodeKey] = (node) => {
				if (typeof currentVisitorFn === "function") {
					currentVisitorFn(node);
				}

				const output = pluginOutput[nodeKey](node);

				if (output) {
					onAdd(output);
				}
			};
		}
	}

	visit<Nodes>(ast, visitor);
};

type VisitorFunction<Key extends keyof Nodes = keyof Nodes> = (
	node: Nodes[Key],
) => void;

const getJSXAttributeValue = (
	node: Nodes["JSXAttrValue"] | undefined,
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
		return getJSXAttributeValue(node.expression as Nodes["JSXAttrValue"]);
	}

	return createUnknownToken(node.type);
};

/**
 * Helper to unify the way unknown AST token are managed.
 * @param token - AST token value.
 * @returns Formatted AST token.
 * @example
 * createUnknownToken("VariableDeclaration");
 */
const createUnknownToken = (token: string) => `#${token}`;
