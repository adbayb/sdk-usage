import { Context } from "./context";
import { Package } from "./package";

export type Item = {
	createdAt: string;
	name: string;
	module: string;
	location: Location;
	type: "component" | "type" | "method" | "variable" | "unknown";
	args?:
		| {
				data: Record<string, unknown>;
				isSpread: boolean;
		  }
		| undefined;
};

/**
 * Aggregate factory that creates a sonar item.
 * A sonar item is the parsing unit output.
 * @param input Factory variables
 * @returns created item
 */
export const createItem = ({
	module,
	name,
	type,
	args,
	code,
	offset,
	root,
	pkg,
}: Pick<Item, "module" | "name" | "type" | "args"> &
	Pick<Location, "root" | "pkg" | "file"> & {
		code: string;
		offset: number;
	}) => {
	const location: Location = {
		...createPosition(code, offset),
		root,
		file: "./index.ts",
		pkg,
	};
	const item: Item = {
		createdAt: new Date().toISOString(),
		name,
		type,
		module,
		args,
		location,
	};

	if (pkg) {
		item.location.pkg = pkg;
	}

	return item;
};

type Location = Position &
	Pick<Context, "root"> & {
		/** Relative path to the file */
		file: string;
		/** Package metadata */
		pkg?: Pick<Package, "name" | "version"> | undefined;
	};

type Position = {
	line: number;
	column: number;
};

const createPosition = (code: string, offset: number) => {
	const linesTillOffset = code.substring(0, offset).split(/\n/);
	const line = linesTillOffset.length;
	const column = (linesTillOffset[line - 1] as string).length;

	return {
		column,
		line,
	};
};
