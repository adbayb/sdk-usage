import type {
	ImportDeclaration,
	JSXAttrValue,
	JSXOpeningElement,
	TsType,
} from "@swc/core";

export type Primitive = bigint | boolean | number | string | null | undefined;

export type Nodes = {
	ImportDeclaration: ImportDeclaration;
	JSXAttrValue: JSXAttrValue;
	JSXOpeningElement: JSXOpeningElement;
	TsType: TsType;
};

/**
 * Import entity to model an import statement.
 */
export type Import = {
	name: string;
	alias: string;
	module: string; // import specifier value
};

/**
 * Package entity to model `package.json` metadata.
 */
export type Package = {
	name: string;
	description: string;
	dependencies?: Record<string, string>;
	devDependencies?: Record<string, string>;
	optionalDependencies?: Record<string, string>;
	peerDependencies?: Record<string, string>;
	version: string;
};
