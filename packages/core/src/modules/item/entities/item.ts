import type { Package } from "../../../types";

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
	module: Package["name"];
	type: "component" | "method" | "type" | "unknown" | "variable";
	version: Package["version"];
};
