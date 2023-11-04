import type { Location } from "./location";

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
	module,
	name,
	type,
	location,
}: Pick<Item, "args" | "location" | "module" | "name" | "type">) => {
	const item: Item = {
		createdAt: new Date().toISOString(),
		name,
		type,
		module,
		args,
		location,
	};

	return item;
};
