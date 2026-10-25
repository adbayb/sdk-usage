import type { ItemDTO } from "../../entities/item";
import type { Import, Nodes, Primitive } from "../../types";

/**
 * Returns a plugin definition unchanged for convenient type inference.
 *
 * @param input - Plugin implementation.
 * @returns The supplied plugin implementation.
 */
export const createPlugin = (input: Plugin) => {
	return input;
};

export type Plugin = (
	context: {
		// TODO: do not expose setters (read-only context for getter purposes)
		imports: Map<Import["alias"], Import>;
	},
	helpers: {
		getJSXAttributeValue: (node: Nodes["JSXAttrValue"] | undefined) => Primitive;
	},
) => {
	[Key in keyof Nodes]?: (node: Nodes[Key]) => ItemDTO | undefined;
};
