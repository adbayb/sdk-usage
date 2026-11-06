import type {
	CallExpression as AstCallExpression,
	Identifier as AstIdentifier,
	ImportDeclaration as AstImportDeclaration,
	JSXOpeningElement as AstJSXOpeningElement,
	NewExpression as AstNewExpression,
	OptionalChainingExpression as AstOptionalChainingExpression,
	TaggedTemplateExpression as AstTaggedTemplateExpression,
	TsExpressionWithTypeArguments as AstTsExpressionWithTypeArguments,
	TsType as AstTsType,
	VariableDeclarator as AstVariableDeclarator,
} from "@swc/core";

export {
	type JSXAttrValue as AstJSXAttrValue,
	type JSXExpression as AstJSXExpression,
} from "@swc/core";

export type AstNode = Record<string, unknown>;

export type AstNodes = {
	CallExpression: AstCallExpression;
	Identifier: AstIdentifier;
	ImportDeclaration: AstImportDeclaration;
	JSXOpeningElement: AstJSXOpeningElement;
	NewExpression: AstNewExpression;
	OptionalChainingExpression: AstOptionalChainingExpression;
	TaggedTemplateExpression: AstTaggedTemplateExpression;
	TsExpressionWithTypeArguments: AstTsExpressionWithTypeArguments;
	TsImportType: Extract<AstTsType, { type: "TsImportType" }>;
	TsTypeQuery: Extract<AstTsType, { type: "TsTypeQuery" }>;
	TsTypeReference: Extract<AstTsType, { type: "TsTypeReference" }>;
	VariableDeclarator: AstVariableDeclarator;
};

/** Import entity to model an import statement. */
export type Import = {
	name: string;
	alias: string;
	/** SWC context used to distinguish this import from shadowing local bindings. */
	bindingContext: number | undefined;
	module: string; // Import specifier value
	typeOnly: boolean;
};

/** Package entity to model `package.json` metadata. */
export type Package = {
	name: string;
	description: string;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	optionalDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
	version: string;
};

export type Primitive = bigint | boolean | null | number | string | undefined;

/** Placeholder for a JSX expression whose source value is not statically known. */
export type UnsupportedSyntaxToken = {
	syntax: string;
	type: "unsupported-syntax";
};
