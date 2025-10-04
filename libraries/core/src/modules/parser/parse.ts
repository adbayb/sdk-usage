import { parse as swcParse } from "@swc/core";
import type { Module } from "@swc/core";
import { visit } from "@open-vanilla/visitor";

import type { Plugin } from "../plugin";
import type { Import, Nodes, Primitive } from "../../types";
import type { ItemDTO } from "../../entities/item";

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

	if (ast === undefined) return;

	const visitor: {
		[Key in keyof Nodes]?: VisitorFunction<Key>;
	} = {
		ImportDeclaration(node) {
			const module = node.source.value;

			node.specifiers.forEach((specifier) => {
				const specifierValue = specifier.local.value;

				context.imports.set(specifierValue, {
					name:
						// @ts-expect-error `imported` field is not exposed by `ImportSpecifier` node (issue in `@swc/core` type definition).
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
		});

		const nodeKeys = Object.keys(
			pluginOutput,
		) as (keyof typeof pluginOutput)[];

		for (const nodeKey of nodeKeys) {
			const currentVisitorFunction = visitor[nodeKey] as
				| VisitorFunction
				| undefined;

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

type VisitorFunction<Key extends keyof Nodes = keyof Nodes> = (
	node: Nodes[Key],
) => void;

const getJSXAttributeValue = (
	node: Nodes["JSXAttrValue"] | undefined,
	// eslint-disable-next-line sonarjs/cyclomatic-complexity
): Primitive => {
	if (!node) {
		return true;
	}

	switch (node.type) {
		case "NullLiteral": {
			return null;
		}
		case "StringLiteral":
		case "NumericLiteral":
		case "BigIntLiteral":
		case "BooleanLiteral":
		case "JSXText": {
			return node.value;
		}
		case "JSXExpressionContainer": {
			return getJSXAttributeValue(
				node.expression as Nodes["JSXAttrValue"],
			);
		}
		case "JSXElement":
		case "JSXFragment":
		case "RegExpLiteral":
		default: {
			return createUnknownToken(node.type);
		}
	}
};

/**
 * Helper to unify the way unknown AST token are managed.
 * @param token - AST token value.
 * @returns Formatted AST token.
 * @example
 * createUnknownToken("VariableDeclaration");
 */
const createUnknownToken = (token: string) => `#${token}`;
