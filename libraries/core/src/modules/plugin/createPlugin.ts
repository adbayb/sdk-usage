import type { Import, Nodes, Primitive } from "../../types";
import type { ItemDTO } from "../../entities/item";

export const createPlugin = (input: Plugin) => {
	return input;
};

export type Plugin = (
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
