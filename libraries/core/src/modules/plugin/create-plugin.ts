import type { ItemDTO } from "../../entities/item";
import type {
	AstNode,
	AstJSXAttrValue,
	AstNodes,
	Import,
	Primitive,
	UnsupportedSyntaxToken,
} from "../../types";

/**
 * Returns a plugin definition unchanged for convenient type inference.
 *
 * @param input - Plugin implementation.
 * @returns The supplied plugin implementation.
 */
export const createPlugin = (input: Plugin) => {
	return input;
};

export type Plugin = (input: {
	getJSXAttributeValue: (node: AstJSXAttrValue | undefined) => Primitive | UnsupportedSyntaxToken;
	getParentNode: (node: object) => AstNode | undefined;
	imports: Map<Import["alias"], Import>;
}) => {
	[Key in keyof AstNodes]?: (node: AstNodes[Key]) => ItemDTO | undefined;
};
