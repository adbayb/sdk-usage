import { createPlugin } from "@sdk-usage/core";

/** Plugin that collects JSX usages of imported components. */
export const plugin = createPlugin((context, { getJSXAttributeValue }) => {
	return {
		JSXOpeningElement(node) {
			if (node.name.type !== "Identifier") {
				return;
			}

			const name = node.name.value;
			const importMetadata = context.imports.get(name);

			if (!importMetadata) {
				return;
			}

			return {
				name: importMetadata.name,
				input: {
					metadata: {
						withSpreading: false, // TODO
					},
					data: node.attributes.reduce<Record<string, unknown>>((props, property) => {
						if (
							property.type !== "JSXAttribute" ||
							property.name.type !== "Identifier"
						) {
							return props;
						}

						props[property.name.value] = getJSXAttributeValue(property.value);

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
