import { relative } from "node:path";

import type { Item } from "./entities/item";
import type { Location } from "./entities/location";

type CreateItemInput = Pick<
	Item,
	"args" | "module" | "name" | "type" | "version"
> & {
	location: CreateLocationInput;
};

/**
 * Aggregate factory that creates a sonar item.
 * A sonar item is the parsing unit output.
 * @param input Factory variables
 * @returns created item
 */
export const createItem = ({
	name,
	args,
	location,
	module,
	type,
	version,
}: CreateItemInput) => {
	const item: Item = {
		name,
		args,
		createdAt: new Date().toISOString(),
		location: createLocation(location),
		module,
		type,
		version,
	};

	return item;
};

type CreateLocationInput = Pick<Location, "file" | "module"> & {
	code: string;
	offset: number;
	path: string;
};

const createLocation = ({
	code,
	file,
	module,
	offset,
	path,
}: CreateLocationInput) => {
	const linesTillOffset = code.substring(0, offset).split(/\n/);
	const line = linesTillOffset.length;
	const column = (linesTillOffset[line - 1] as string).length;

	return {
		column,
		file: `./${relative(path, file)}`,
		line,
		module,
	};
};
