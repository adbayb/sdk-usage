import type { Import, Nodes, Primitive } from "../../types";
import type { Item } from "../item";

export const createPlugin = (factory: Plugin) => {
	return factory;
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
	[Key in keyof Nodes]?: (node: Nodes[Key]) => PluginOutput | undefined;
};

export type PluginOutput = Partial<Pick<Item, "data" | "metadata">> &
	Pick<Item, "module" | "name" | "type"> & {
		offset: number;
	};
