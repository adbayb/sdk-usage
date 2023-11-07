import type { Package } from "../../../types";

import type { Location } from "./location";

export type Item = {
	name: string;
	createdAt: string;
	data: Record<string, unknown>;
	location: Location;
	metadata: {
		hasSpreadOperator: boolean;
	};
	module: Package["name"];
	type: "component" | "method" | "type" | "unknown" | "variable";
	version: Package["version"];
};
