import { createPlugin } from "@esusage/core";

const TYPE = "jsx-element";

export default createPlugin((context, { getJSXAttributeValue }) => {
	return {
		JSXOpeningElement(node) {
			if (node.name.type !== "Identifier") return;

			const name = node.name.value;
			const importMetadata = context.imports.get(name);

			if (!importMetadata) return;

			return {
				name: importMetadata.name,
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
				module: importMetadata.module,
				offset: node.span.start,
				type: TYPE,
			};
		},
	};
});
