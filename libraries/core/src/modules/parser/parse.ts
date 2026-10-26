import { visit } from "@open-vanilla/visitor";
import type { Module } from "@swc/core";
import { parse as swcParse } from "@swc/core";
import type { Import, Nodes, Primitive } from "../../types";
import type { Plugin } from "../plugin";

export type ParseOptions = {
	file: string;
	plugins: Plugin[];
};

/**
 * Collects SDK usages from a source file using the enabled plugins.
 *
 * @param code - Source text to parse.
 * @param options - Parse options.
 * @param options.file - Source file path, used in parse errors.
 * @param options.plugins - Enabled plugins.
 * @returns An iterator of collected SDK usages with their source positions.
 */
export const parse = async (code: string, { file, plugins }: ParseOptions) => {
	let ast: Module;

	try {
		ast = await swcParse(code, { syntax: "typescript", tsx: true });
	} catch (error) {
		throw new Error(`Failed to parse source file: ${file}`, { cause: error });
	}

	const context = { imports: new Map<Import["alias"], Import>() };

	visit<Nodes>(ast, {
		ImportDeclaration(node) {
			for (const specifier of node.specifiers) {
				const alias = specifier.local.value;

				// SWC's runtime can emit null for this field despite its declared type.
				const name =
					"imported" in specifier && Boolean(specifier.imported)
						? specifier.imported.value
						: alias;

				context.imports.set(alias, { name, alias, module: node.source.value });
			}
		},
	});

	const visitorsByType = Map.groupBy(
		plugins.flatMap((plugin) => {
			return Object.entries(plugin(context, { getJSXAttributeValue }));
		}),
		([type]) => {
			return type;
		},
	);

	return getNodes(ast)
		.flatMap((node) => {
			const visitors = visitorsByType.get(String(node.type)) ?? [];

			return visitors.map(([, visitor]) => {
				const item = visitor(node as never);

				if (item) {
					// SWC spans are 1-based byte positions, even across parse calls.
					item.offset -= 1;
				}

				return item;
			});
		})
		.filter((item) => {
			return item !== undefined;
		});
};

const getNodes = (ast: Module) => {
	const pending: unknown[] = [ast];

	const nodes: Iterator<Record<string, unknown>, undefined> = {
		next(): IteratorResult<Record<string, unknown>, undefined> {
			while (pending.length > 0) {
				const value = pending.pop();

				if (!isRecord(value)) {
					continue;
				}

				const children = Object.values(value);

				for (let index = children.length - 1; index >= 0; index -= 1) {
					pending.push(children[index]);
				}

				if (!Array.isArray(value)) {
					return { done: false, value };
				}
			}

			return { done: true, value: undefined };
		},
	};

	return Iterator.from(nodes);
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null;
};

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
 * Creates a placeholder for an unsupported source expression.
 *
 * @example
 * 	createUnknownToken("VariableDeclaration");
 *
 * @param token - AST token value.
 * @returns A placeholder identifying the unsupported expression.
 */
const createUnknownToken = (token: string) => {
	return `#${token}`;
};
