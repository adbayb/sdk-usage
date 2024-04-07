import type { Package } from "../../../types";

import type { Location } from "./location";

export type Item = {
	name: string;
	createdAt: string;
	data: Record<string, unknown>;
	location: Location;
	metadata: {
		withSpreading: boolean;
	};
	module: Package["name"];
	type: string;
	version: Package["version"];
};
