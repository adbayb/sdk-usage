import { createSyntaxPlugin } from "@sdk-usage/core";

export default createSyntaxPlugin((context) => {
	return {
		TsType(node) {
			let typeValue = "";

			if (
				node.type === "TsTypeReference" &&
				node.typeName.type === "Identifier"
			) {
				typeValue = node.typeName.value;
			}

			if (
				node.type === "TsIndexedAccessType" &&
				node.objectType.type === "TsTypeReference" &&
				node.objectType.typeName.type === "Identifier"
			) {
				typeValue = node.objectType.typeName.value;
			}

			const importMetadata = context.imports.get(typeValue);

			if (!importMetadata) return;

			return {
				name: importMetadata.name,
				module: importMetadata.module,
				offset: node.span.start,
				type: "typescript/type",
			};
		},
	};
});
