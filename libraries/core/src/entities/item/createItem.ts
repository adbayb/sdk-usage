import type { Package } from "../../types";
import type { CreateLocationInput, Location } from "./createLocation";

import { createLocation } from "./createLocation";

export type Item = {
	createdAt: string;
	input: {
		data: Record<string, unknown>;
		metadata: {
			withSpreading: boolean;
		};
	};
	location: Location;
	module: Package["name"];
	name: string;
	type: string;
	version: Package["version"];
};

export type ItemDTO = {
	offset: number;
} & Partial<Pick<Item, "input">> &
	Pick<Item, "module" | "name" | "type">;

type CreateItemInput = {
	location: CreateLocationInput;
} & Partial<Pick<Item, "input">> &
	Pick<Item, "module" | "name" | "type" | "version">;

/**
 * Aggregate factory that creates an item.
 * @param input - Factory variables.
 * @param input.name - Name.
 * @param input.type - Component type.
 * @param input.module - Source module.
 * @param input.version - Module version.
 * @param input.location - Location.
 * @param input.input - Parameter list and metadata describing the way it's passed.
 * @returns Created item.
 * @example
 * createItem({ ... });
 */
export const createItem = ({
	input,
	location,
	module,
	name,
	type,
	version,
}: CreateItemInput) => {
	const item: Item = {
		createdAt: new Date().toISOString(),
		input: {
			data: input?.data ?? {},
			metadata: {
				withSpreading: input?.metadata.withSpreading ?? false,
			},
		},
		location: createLocation(location),
		module,
		name,
		type,
		version,
	};

	return item;
};
