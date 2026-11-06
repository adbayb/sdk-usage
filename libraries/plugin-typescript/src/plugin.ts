import { createPlugin } from "@sdk-usage/core";
import type { Plugin } from "@sdk-usage/core";

/** Plugin that collects TypeScript usages of imported types. */
export const plugin = createPlugin((input) => {
	return {
		TsExpressionWithTypeArguments(node) {
			let name: string | undefined;
			let { expression } = node;

			while (expression.type === "MemberExpression") {
				if (expression.property.type !== "Identifier") {
					return;
				}

				name ??= expression.property.value;
				expression = expression.object;
			}

			if (expression.type !== "Identifier") {
				return;
			}

			const importMetadata = getImported(expression, input.imports);

			if (!importMetadata) {
				return;
			}

			return {
				name: name ?? importMetadata.name,
				module: importMetadata.module,
				offset: node.span.start,
				type: "typescript/type",
			};
		},
		TsImportType(node) {
			let name: string | undefined;
			let { qualifier } = node;

			while (qualifier?.type === "TsQualifiedName") {
				name ??= qualifier.right.value;
				qualifier = qualifier.left;
			}

			name ??= qualifier?.value;

			if (!name) {
				return;
			}

			return {
				name,
				module: node.argument.value,
				offset: node.span.start,
				type: "typescript/type",
			};
		},
		TsTypeQuery(node) {
			let name: string | undefined;
			let { exprName } = node;

			while (exprName.type === "TsQualifiedName") {
				name ??= exprName.right.value;
				exprName = exprName.left;
			}

			if (exprName.type !== "Identifier") {
				return;
			}

			const importMetadata = getImported(exprName, input.imports);

			if (!importMetadata) {
				return;
			}

			return {
				name: name ?? importMetadata.name,
				module: importMetadata.module,
				offset: node.span.start,
				type: "typescript/type",
			};
		},
		TsTypeReference(node) {
			let name: string | undefined;
			let root = node.typeName;

			while (root.type === "TsQualifiedName") {
				name ??= root.right.value;
				root = root.left;
			}

			const importMetadata = getImported(root, input.imports);

			if (!importMetadata) {
				return;
			}

			return {
				name: name ?? importMetadata.name,
				module: importMetadata.module,
				offset: node.span.start,
				type: "typescript/type",
			};
		},
	};
});

type ImportedIdentifier = { ctxt?: number; value: string };

type Imports = Parameters<Plugin>[0]["imports"];

const getImported = (identifier: ImportedIdentifier, imports: Imports) => {
	const imported = imports.get(identifier.value);

	return identifier.ctxt !== undefined && imported?.bindingContext === identifier.ctxt
		? imported
		: undefined;
};
