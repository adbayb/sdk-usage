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
						(props, prop) => {
							if (
								prop.type !== "JSXAttribute" ||
								prop.name.type !== "Identifier"
							)
								return props;

							props[prop.name.value] = getJSXAttributeValue(
								prop.value,
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
