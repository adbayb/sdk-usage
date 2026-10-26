import type { Package } from "../../types";
import type { Location } from "./create-locator";

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
	Pick<Item, "location" | "module" | "name" | "type" | "version">;

/**
 * Creates an SDK usage item.
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
 * @returns An SDK usage item with its source location and module version.
 */
export const createItem = ({
	name,
	input,
	location,
	module,
	type,
	version,
}: CreateItemInput): Item => {
	return {
		name,
		createdAt: new Date().toISOString(),
		input: {
			metadata: {
				withSpreading: input?.metadata.withSpreading ?? false,
			},
			data: input?.data ?? {},
		},
		location,
		module,
		type,
		version,
	};
};
