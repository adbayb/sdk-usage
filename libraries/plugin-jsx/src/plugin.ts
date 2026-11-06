import { createPlugin } from "@sdk-usage/core";

/** Plugin that collects JSX usages of imported components. */
export const plugin = createPlugin((input) => {
	return {
		JSXOpeningElement(node) {
			let name: string | undefined;
			let root = node.name;

			if (root.type === "JSXNamespacedName") {
				name = root.name.value;
				root = root.namespace;
			} else {
				while (root.type === "JSXMemberExpression") {
					name ??= root.property.value;
					root = root.object;
				}
			}

			const importMetadata = input.imports.get(root.value);

			const bindingContext =
				"ctxt" in root && typeof root.ctxt === "number" ? root.ctxt : undefined;

			if (
				!importMetadata ||
				importMetadata.typeOnly ||
				(bindingContext !== undefined && importMetadata.bindingContext !== bindingContext)
			) {
				return;
			}

			return {
				name: name ?? importMetadata.name,
				input: {
					metadata: {
						withSpreading: node.attributes.some((attribute) => {
							return attribute.type === "SpreadElement";
						}),
					},
					data: node.attributes.reduce<Record<string, unknown>>((props, property) => {
						if (property.type !== "JSXAttribute") {
							return props;
						}

						const attributeName =
							property.name.type === "Identifier"
								? property.name.value
								: `${property.name.namespace.value}:${property.name.name.value}`;

						props[attributeName] = input.getJSXAttributeValue(property.value);

						return props;
					}, {}),
				},
				module: importMetadata.module,
				offset: node.span.start,
				type: "jsx/element",
			};
		},
	};
});
