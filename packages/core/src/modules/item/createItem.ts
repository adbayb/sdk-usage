import { relative } from "node:path";

import type { Item } from "./entities/item";
import type { Location } from "./entities/location";

type CreateItemInput = Partial<Pick<Item, "data" | "metadata">> &
	Pick<Item, "module" | "name" | "type" | "version"> & {
		location: CreateLocationInput;
	};

/**
 * Aggregate factory that creates an item.
 * @param input - Factory variables.
 * @param input.name - Name.
 * @param input.data - Parameter list.
 * @param input.location - Location.
 * @param input.metadata - Metadata that describe the way the code is passed.
 * @param input.module - Source module.
 * @param input.type - Component type.
 * @param input.version - Module version.
 * @returns Created item.
 * @example
 * createItem({ ... });
 */
export const createItem = ({
	name,
	data,
	location,
	metadata,
	module,
	type,
	version,
}: CreateItemInput) => {
	const item: Item = {
		name,
		createdAt: new Date().toISOString(),
		data: data ?? {},
		location: createLocation(location),
		metadata: {
			withSpreading: metadata?.withSpreading ?? false,
		},
		module,
		type,
		version,
	};

	return item;
};

type CreateLocationInput = Pick<Location, "file" | "link" | "module"> & {
	code: string;
	offset: number;
	path: string;
};

const createLocation = ({
	code,
	file,
	link,
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
		link,
		module,
	};
};
