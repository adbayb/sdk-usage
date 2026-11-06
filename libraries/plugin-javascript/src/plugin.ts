import { createPlugin } from "@sdk-usage/core";
import type { Plugin } from "@sdk-usage/core";

/** Collects imported runtime values when they are called, constructed, or referenced. */
export const plugin = createPlugin((input) => {
	return {
		CallExpression(node) {
			return createCalleeUsage(
				node.callee,
				node.span.start,
				"javascript/call",
				input.imports,
			);
		},
		Identifier(node) {
			const imported = getImported(node, input.imports);

			if (!imported || isNonRuntimeReference(node, input.getParentNode)) {
				return;
			}

			const { name, parent } = getMemberReference(node, input.getParentNode);

			if (parent?.type === "MemberExpression") {
				return;
			}

			if (
				parent?.type === "CallExpression" ||
				parent?.type === "NewExpression" ||
				parent?.type === "TaggedTemplateExpression"
			) {
				return;
			}

			return {
				name: name ?? imported.name,
				module: imported.module,
				offset: node.span.start,
				type: "javascript/reference",
			};
		},
		NewExpression(node) {
			return createCalleeUsage(
				node.callee,
				node.span.start,
				"javascript/constructor",
				input.imports,
			);
		},
		TaggedTemplateExpression(node) {
			return createCalleeUsage(node.tag, node.span.start, "javascript/call", input.imports);
		},
	};
});

type AstCallee =
	| AstCallNode["callee"]
	| AstConstructorNode["callee"]
	| AstOptionalChainingExpression["base"];

type AstCallNode = Parameters<NonNullable<ReturnType<Plugin>["CallExpression"]>>[0];

type AstConstructorNode = Parameters<NonNullable<ReturnType<Plugin>["NewExpression"]>>[0];

type AstGetParentNode = Parameters<Plugin>[0]["getParentNode"];

type AstIdentifierNode = Parameters<NonNullable<ReturnType<Plugin>["Identifier"]>>[0] & {
	ctxt?: number;
};

type AstNode = NonNullable<ReturnType<AstGetParentNode>>;

type AstOptionalChainingExpression = Parameters<
	NonNullable<ReturnType<Plugin>["OptionalChainingExpression"]>
>[0];

type Imports = Parameters<Plugin>[0]["imports"];

type UsageType = "javascript/call" | "javascript/constructor" | "javascript/reference";

const createCalleeUsage = (
	callee: AstCallee,
	offset: number,
	type: UsageType,
	imports: Imports,
) => {
	const { name, root } = getCalleeRoot(callee);

	if (root.type !== "Identifier") {
		return;
	}

	const imported = getImported(root, imports);

	if (!imported) {
		return;
	}

	return {
		name: name ?? imported.name,
		module: imported.module,
		offset,
		type,
	};
};

const getCalleeRoot = (callee: AstCallee) => {
	let name: string | undefined;
	let root = callee;

	while (root.type === "MemberExpression" || root.type === "OptionalChainingExpression") {
		if (root.type === "OptionalChainingExpression") {
			root = root.base;

			continue;
		}

		const propertyName = getPropertyName(root);

		if (!propertyName) {
			return { name: undefined, root };
		}

		name ??= propertyName;
		root = root.object;
	}

	return { name, root };
};

const getMemberReference = (identifier: AstIdentifierNode, getParentNode: AstGetParentNode) => {
	let name: string | undefined;
	let current: object = identifier;
	let parent = getParentNode(current);

	while (parent) {
		if (parent.type === "OptionalChainingExpression" && parent.base === current) {
			current = parent;
			parent = getParentNode(current);

			continue;
		}

		if (
			parent.type !== "MemberExpression" ||
			parent.object !== current ||
			!isMemberExpression(parent)
		) {
			break;
		}

		const propertyName = getPropertyName(parent);

		if (!propertyName) {
			return { name: undefined, parent };
		}

		name = propertyName;
		current = parent;
		parent = getParentNode(current);
	}

	return { name, parent };
};

const getImported = (identifier: AstIdentifierNode, imports: Imports) => {
	const imported = imports.get(identifier.value);

	if (
		!imported ||
		imported.typeOnly ||
		identifier.ctxt === undefined ||
		imported.bindingContext !== identifier.ctxt
	) {
		return;
	}

	return imported;
};

const isNonRuntimeReference = (identifier: object, getParentNode: AstGetParentNode) => {
	let current: object = identifier;
	let parent = getParentNode(identifier);

	while (parent) {
		if (parent.type === "VariableDeclarator" && parent.id === current) {
			return true;
		}

		if (
			typeof parent.type === "string" &&
			(parent.type.startsWith("Ts") || parent.type.startsWith("Import"))
		) {
			return true;
		}

		if (parent.type === "JSXExpressionContainer") {
			return false;
		}

		if (typeof parent.type === "string" && parent.type.startsWith("JSX")) {
			return true;
		}

		if (parent.type === "CallExpression" || parent.type === "NewExpression") {
			return false;
		}

		if (parent.type === "TaggedTemplateExpression") {
			return false;
		}

		current = parent;
		parent = getParentNode(parent);
	}

	return false;
};

const isMemberExpression = (
	node: AstNode,
): node is AstNode & {
	object: object;
	property: object;
	type: "MemberExpression";
} => {
	return node.type === "MemberExpression" && "object" in node && "property" in node;
};

const getPropertyName = (node: { property: unknown }) => {
	if (!("property" in node) || !isRecord(node.property)) {
		return undefined;
	}

	if (node.property.type === "Identifier" && typeof node.property.value === "string") {
		return node.property.value;
	}

	if (
		node.property.type === "Computed" &&
		"expression" in node.property &&
		isRecord(node.property.expression) &&
		node.property.expression.type === "StringLiteral" &&
		typeof node.property.expression.value === "string"
	) {
		return node.property.expression.value;
	}

	return undefined;
};

const isRecord = (value: unknown): value is AstNode => {
	return typeof value === "object" && value !== null;
};
