import type { JSXAttrValue, JSXOpeningElement, TsType } from "@swc/core";

import type { Import, Primitive } from "../../types";
import type { Item } from "../item";

// TODO: rename file to types.ts

export type Nodes = {
	JSXAttrValue: JSXAttrValue;
	JSXOpeningElement: JSXOpeningElement;
	TsType: TsType;
};

export type PluginItemOutput = Partial<Pick<Item, "data" | "metadata">> &
	Pick<Item, "module" | "name" | "type"> & {
		offset: number;
	};

export type Plugin<N extends Partial<Nodes>> = (
	context: {
		// TODO: do not expose setters (read-only context for getter purposes)
		imports: Map<Import["alias"], Import>;
	},
	helpers: {
		getJSXAttributeValue: (node: JSXAttrValue | undefined) => Primitive;
	},
) => {
	[Key in keyof N]: (node: N[Key]) => PluginItemOutput | undefined;
};

export const jsxElementPlugin: Plugin<Pick<Nodes, "JSXOpeningElement">> = (
	context,
	{ getJSXAttributeValue },
) => {
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
				type: "jsx-element",
			};
		},
	};
};

export const typePlugin: Plugin<Pick<Nodes, "TsType">> = (context) => {
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
				type: "type",
			};
		},
	};
};
