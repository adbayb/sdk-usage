import type { Package } from "../../types";
import type { CreateLocationInput, Location } from "./create-location";
import { createLocation } from "./create-location";

export type Item = {
	name: string;
	createdAt: string;
	input: {
		metadata: {
			withSpreading: boolean;
		};
		data: Record<string, unknown>;
	};
	location: Location;
	module: Package["name"];
	type: string;
	version: Package["version"];
};

export type ItemDTO = Partial<Pick<Item, "input">> &
	Pick<Item, "module" | "name" | "type"> & {
		offset: number;
	};

type CreateItemInput = Partial<Pick<Item, "input">> &
	Pick<Item, "module" | "name" | "type" | "version"> & {
		location: CreateLocationInput;
	};

/**
 * Aggregate factory that creates an item.
 *
 * @example
 * 	createItem({ ... });
 *
 * @param input - Factory variables.
 * @param input.name - Name.
 * @param input.type - Component type.
 * @param input.module - Source module.
 * @param input.version - Module version.
 * @param input.location - Location.
 * @param input.input - Parameter list and metadata describing the way it's passed.
 * @returns Created item.
 */
export const createItem = ({ name, input, location, module, type, version }: CreateItemInput) => {
	const item: Item = {
		name,
		createdAt: new Date().toISOString(),
		input: {
			metadata: {
				withSpreading: input?.metadata.withSpreading ?? false,
			},
			data: input?.data ?? {},
		},
		location: createLocation(location),
		module,
		type,
		version,
	};

	return item;
};
