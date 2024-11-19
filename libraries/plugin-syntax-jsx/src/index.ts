import { createSyntaxPlugin } from "@esusage/core";

export default createSyntaxPlugin((context, { getJSXAttributeValue }) => {
	return {
		JSXOpeningElement(node) {
			if (node.name.type !== "Identifier") return;

			const name = node.name.value;
			const importMetadata = context.imports.get(name);

			if (!importMetadata) return;

			return {
				name: importMetadata.name,
				input: {
					data: node.attributes.reduce<Record<string, unknown>>(
						(props, property) => {
							if (
								property.type !== "JSXAttribute" ||
								property.name.type !== "Identifier"
							)
								return props;

							props[property.name.value] = getJSXAttributeValue(
								property.value,
							);

							return props;
						},
						{},
					),
					metadata: {
						withSpreading: false, // TODO
					},
				},
				module: importMetadata.module,
				offset: node.span.start,
				type: "jsx/element",
			};
		},
	};
});
