import type { Readable } from "node:stream";
import { visit } from "@open-vanilla/visitor";
import type { Module } from "@swc/core";
import { parse as swcParse } from "@swc/core";
import type { ItemDTO } from "../../entities/item";
import type { Import, Nodes, Primitive } from "../../types";
import { createObjectStream } from "../create-object-stream";
import type { Plugin } from "../plugin";

export type ParseOptions = {
	file: string;
	plugins: Plugin[];
};

export const parse = (
	code: string,
	{ file, plugins }: ParseOptions,
): AsyncIterable<ItemDTO> & Omit<Readable, typeof Symbol.asyncIterator> => {
	return createObjectStream(async (emit, signal) => {
		return parseSource(code, file, plugins, emit, signal);
	});
};

const parseSource = async (
	code: string,
	file: string,
	plugins: Plugin[],
	emit: (item: ItemDTO) => Promise<void>,
	signal: AbortSignal,
): Promise<void> => {
	const context = {
		imports: new Map<Import["alias"], Import>(),
	};

	let ast: Module;

	try {
		ast = await swcParse(code, {
			syntax: "typescript",
			tsx: true,
		});
	} catch (error) {
		throw new Error(`Failed to parse source file: ${file}`, { cause: error });
	}

	const importVisitor: {
		[Key in keyof Nodes]?: VisitorFunction<Key>;
	} = {
		ImportDeclaration(node) {
			const module = node.source.value;

			node.specifiers.forEach((specifier) => {
				const specifierValue = specifier.local.value;

				// SWC's runtime can emit null for this field despite its declared type.
				const importedName =
					"imported" in specifier && Boolean(specifier.imported)
						? specifier.imported.value
						: specifierValue;

				context.imports.set(specifierValue, {
					name: importedName,
					alias: specifierValue,
					module,
				});
			});
		},
	};

	visit<Nodes>(ast, importVisitor);

	const pluginVisitors = new Map<string, ((node: never) => ItemDTO | undefined)[]>();

	for (const plugin of plugins) {
		const pluginOutput = plugin(context, {
			getJSXAttributeValue,
		});

		const nodeKeys = Object.keys(pluginOutput) as (keyof typeof pluginOutput)[];

		for (const nodeKey of nodeKeys) {
			const visitor = pluginOutput[nodeKey] as
				| ((node: never) => ItemDTO | undefined)
				| undefined;

			const visitors = pluginVisitors.get(nodeKey) ?? [];

			if (visitor) {
				visitors.push(visitor);
				pluginVisitors.set(nodeKey, visitors);
			}
		}
	}

	await visitPluginOutputs(ast, pluginVisitors, emit, signal);
};

const visitPluginOutputs = async (
	ast: Module,
	pluginVisitors: Map<string, ((node: never) => ItemDTO | undefined)[]>,
	emit: (item: ItemDTO) => Promise<void>,
	signal: AbortSignal,
): Promise<void> => {
	const pendingNodes: { index: number; values: unknown[] }[] = [
		{ index: 0, values: Object.values(ast) },
	];

	while (pendingNodes.length > 0) {
		signal.throwIfAborted();

		const frame = pendingNodes.at(-1);

		if (!frame) {
			break;
		}

		if (frame.index >= frame.values.length) {
			pendingNodes.pop();

			continue;
		}

		const child = frame.values[frame.index];

		frame.index += 1;

		if (Array.isArray(child)) {
			pendingNodes.push({ index: 0, values: child });

			continue;
		}

		if (!isRecord(child)) {
			continue;
		}

		if (typeof child.type === "string") {
			for (const visitor of pluginVisitors.get(child.type) ?? []) {
				const output = visitor(child as never);

				if (output) {
					await emit(output);
				}
			}
		}

		pendingNodes.push({ index: 0, values: Object.values(child) });
	}
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return value !== null && typeof value === "object";
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
