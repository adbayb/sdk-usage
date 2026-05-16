import type {
	ImportDeclaration,
	JSXAttrValue,
	JSXOpeningElement,
	TsType,
} from "@swc/core";

/**
 * Import entity to model an import statement.
 */
export type Import = {
	alias: string;
	module: string; // import specifier value
	name: string;
};

export type Nodes = {
	ImportDeclaration: ImportDeclaration;
	JSXAttrValue: JSXAttrValue;
	JSXOpeningElement: JSXOpeningElement;
	TsType: TsType;
};

/**
 * Package entity to model `package.json` metadata.
 */
export type Package = {
	dependencies?: Record<string, string>;
	description: string;
	devDependencies?: Record<string, string>;
	name: string;
	optionalDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
	version: string;
};

export type Primitive = bigint | boolean | null | number | string | undefined;
