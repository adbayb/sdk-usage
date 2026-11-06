import { visit } from "@open-vanilla/visitor";
import type { Module as AstModule } from "@swc/core";
import { parse as swcParse } from "@swc/core";
import type {
	Import,
	AstNodes,
	AstNode,
	AstJSXAttrValue,
	AstJSXExpression,
	Primitive,
	UnsupportedSyntaxToken,
} from "../../types";
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
	let ast: AstModule;

	try {
		ast = await swcParse(code, { syntax: "typescript", tsx: true });
	} catch (error) {
		throw new Error(`Failed to parse source file: ${file}`, { cause: error });
	}

	const context = { imports: new Map<Import["alias"], Import>() };

	visit<AstNodes>(ast, {
		ImportDeclaration(node) {
			for (const specifier of node.specifiers) {
				const alias = specifier.local.value;

				// SWC's runtime can emit null for this field despite its declared type.
				const name =
					"imported" in specifier && Boolean(specifier.imported)
						? specifier.imported.value
						: alias;

				const typeOnly =
					node.typeOnly || ("isTypeOnly" in specifier && specifier.isTypeOnly);

				context.imports.set(alias, {
					name,
					alias,
					bindingContext: getBindingContext(specifier.local),
					module: node.source.value,
					typeOnly,
				});
			}
		},
	});

	visit<AstNodes>(ast, {
		VariableDeclarator(node) {
			const imported = getDeclaratorImport(node, context.imports);

			if (imported) {
				addImportedBindings(node.id, imported, context.imports);
			}
		},
	});

	const parentNodes = getParentNodes(ast);

	const getParentNode = (node: object) => {
		return parentNodes.get(node);
	};

	const visitorsByType = Map.groupBy(
		plugins.flatMap((plugin) => {
			return Object.entries(plugin({ ...context, getJSXAttributeValue, getParentNode }));
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

const getNodes = (ast: AstModule) => {
	const pending: unknown[] = [ast];

	const nodes: Iterator<AstNode, undefined> = {
		next(): IteratorResult<AstNode, undefined> {
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

const getParentNodes = (ast: AstModule) => {
	const parentNodes = new WeakMap<object, AstNode>();

	const pending: {
		parent: AstNode | undefined;
		value: unknown;
	}[] = [{ parent: undefined, value: ast }];

	while (pending.length > 0) {
		const current = pending.pop();

		if (!current) {
			continue;
		}

		const { parent, value } = current;

		if (Array.isArray(value)) {
			for (const child of value) {
				pending.push({ parent, value: child });
			}

			continue;
		}

		if (!isRecord(value)) {
			continue;
		}

		if (parent) {
			parentNodes.set(value, parent);
		}

		for (const child of Object.values(value)) {
			pending.push({ parent: value, value: child });
		}
	}

	return parentNodes;
};

const isRecord = (value: unknown): value is AstNode => {
	return typeof value === "object" && value !== null;
};

const getBindingContext = (identifier: AstNodes["Identifier"]) => {
	return "ctxt" in identifier && typeof identifier.ctxt === "number"
		? identifier.ctxt
		: undefined;
};

const getDeclaratorImport = (
	node: AstNodes["VariableDeclarator"],
	imports: Map<Import["alias"], Import>,
) => {
	const initializer = node.init;

	if (initializer?.type !== "Identifier") {
		return;
	}

	const imported = imports.get(initializer.value);

	return imported?.bindingContext !== undefined &&
		imported.bindingContext === getBindingContext(initializer)
		? imported
		: undefined;
};

const addImportedBindings = (
	pattern: AstNodes["VariableDeclarator"]["id"],
	imported: Import,
	imports: Map<Import["alias"], Import>,
) => {
	if (pattern.type === "Identifier") {
		const { value: alias } = pattern;
		const bindingContext = getBindingContext(pattern);
		const existing = imports.get(alias);

		if (
			bindingContext === undefined ||
			(existing && existing.bindingContext !== bindingContext)
		) {
			return;
		}

		imports.set(alias, { ...imported, alias, bindingContext });

		return;
	}

	if (pattern.type !== "ObjectPattern") {
		return;
	}

	for (const property of pattern.properties) {
		if (property.type === "KeyValuePatternProperty") {
			if (property.key.type === "Identifier" || property.key.type === "StringLiteral") {
				addImportedBindings(
					property.value,
					{ ...imported, name: property.key.value },
					imports,
				);
			}

			continue;
		}

		if (property.type === "AssignmentPatternProperty") {
			addImportedBindings(property.key, { ...imported, name: property.key.value }, imports);
		}
	}
};

const getJSXAttributeValue = (
	node: AstJSXAttrValue | AstJSXExpression | undefined,
	// eslint-disable-next-line sonarjs/cyclomatic-complexity
): Primitive | UnsupportedSyntaxToken => {
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
 * @param syntax - SWC syntax node name.
 * @returns A placeholder identifying the unsupported expression.
 */
const createUnknownToken = (syntax: string): UnsupportedSyntaxToken => {
	return { syntax, type: "unsupported-syntax" };
};
