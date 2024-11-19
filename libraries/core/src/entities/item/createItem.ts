/* eslint-disable sort-keys-custom-order/object-keys */
import type { Package } from "../../types";

import { createLocation } from "./createLocation";
import type { CreateLocationInput, Location } from "./createLocation";

export type Item = {
	name: string;
	createdAt: string;
	input: {
		data: Record<string, unknown>;
		metadata: {
			withSpreading: boolean;
		};
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
	name,
	input,
	location,
	module,
	type,
	version,
}: CreateItemInput) => {
	const item: Item = {
		name,
		type,
		module,
		version,
		createdAt: new Date().toISOString(),
		location: createLocation(location),
		input: {
			metadata: {
				withSpreading: input?.metadata.withSpreading ?? false,
			},
			data: input?.data ?? {},
		},
	};

	return item;
};
