import type {
	ImportDeclaration,
	JSXAttrValue,
	JSXExpression,
	JSXOpeningElement,
	TsType,
} from "@swc/core";

/** Import entity to model an import statement. */
export type Import = {
	name: string;
	alias: string;
	module: string; // Import specifier value
};

export type Nodes = {
	ImportDeclaration: ImportDeclaration;
	JSXAttrValue: JSXAttrValue;
	JSXExpression: JSXExpression;
	JSXOpeningElement: JSXOpeningElement;
	TsType: TsType;
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
