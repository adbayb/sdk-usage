import type { ItemDTO } from "../../entities/item";
import type { Import, Nodes, Primitive } from "../../types";

export const createSyntaxPlugin = (input: SyntaxPlugin) => {
	return input;
};

export type SyntaxPlugin = (
	context: {
		// TODO: do not expose setters (read-only context for getter purposes)
		imports: Map<Import["alias"], Import>;
	},
	helpers: {
		getJSXAttributeValue: (
			node: Nodes["JSXAttrValue"] | undefined,
		) => Primitive;
	},
) => {
	[Key in keyof Nodes]?: (node: Nodes[Key]) => ItemDTO | undefined;
};
