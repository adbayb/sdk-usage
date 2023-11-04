import { relative } from "node:path";

import { CWD } from "../constants";

export type Item = {
	createdAt: string;
	name: string;
	module: string;
	location: Location;
	type: "component" | "method" | "type" | "unknown" | "variable";
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
	args,
	code,
	file,
	module,
	name,
	offset,
	type,
}: CreateLocationParameters &
	Pick<Item, "args" | "module" | "name" | "type">) => {
	const item: Item = {
		createdAt: new Date().toISOString(),
		name,
		type,
		module,
		args,
		location: createLocation({ code, offset, file }),
	};

	return item;
};

type Location = {
	// @todo pkg consumer name
	file: string;
	line: number;
	column: number;
};

type CreateLocationParameters = Pick<Location, "file"> & {
	code: string;
	offset: number;
};

const createLocation = ({ code, offset, file }: CreateLocationParameters) => {
	const linesTillOffset = code.substring(0, offset).split(/\n/);
	const line = linesTillOffset.length;
	const column = (linesTillOffset[line - 1] as string).length;

	return {
		file: `./${relative(CWD, file)}`,
		column,
		line,
	};
};
