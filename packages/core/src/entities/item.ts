import type { Location } from "./location";

export type Item = {
	name: string;
	args?:
		| {
				data: Record<string, unknown>;
				isSpread: boolean;
		  }
		| undefined;
	createdAt: string;
	location: Location;
	module: string;
	type: "component" | "method" | "type" | "unknown" | "variable";
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
}: Pick<Item, "args" | "location" | "module" | "name" | "type">) => {
	const item: Item = {
		name,
		args,
		createdAt: new Date().toISOString(),
		location,
		module,
		type,
	};

	return item;
};
