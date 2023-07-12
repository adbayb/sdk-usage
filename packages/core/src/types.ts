export type ParserMethods = {
	createItem(
		input: Pick<Item, "module" | "name" | "args" | "type"> & {
			offset: number;
		}
	): Item;
	createFallbackToken(token: string): string;
};

export type Parser = {
	id: string;
	execute(code: string, methods: ParserMethods): Promise<Array<Item>>;
};

export type Primitive = string | boolean | undefined | null | bigint | number;

type Metadata = {
	source: string; // URL (if VCS) or filesystem path for the currently analyzed project
};

/**
 * Execution context location metadata
 */
export type Location = {
	/** The root path of the analyzed project */
	project: string;
	/** Relative path to the file */
	file: string;
	line: number;
	column: number;
	module?: string;
};

export type Item = {
	createdAt: string;
	name: string;
	module: string;
	version?: string; // Required only if the retrieved module is external (ie. define as a package dependency)
	location: Location;
	type: "component" | "type" | "method" | "variable" | "unknown";
	args?:
		| {
				data: Record<string, unknown>;
				isSpread: boolean;
		  }
		| undefined;
};

/**
 * Plugins introduce only external side effects without having control over internal side effects
 * to not introduce weird behaviors if multiple plugins are composed together
 * @example instance counter, elasticsearch put op, ...
 */
export type Plugin = {
	onStart(metadata: Metadata): void; // For initial operations (eg. setting up the initial context)
	onCollect(item: Item): void; // For atomic operations on a single item (eg. rest calls, specific item alteration, ...)
	onEnd(items: Array<Item>): void; // For global operations on all items (eg. managing write operations, clean up, or even reducing items to count elements, ...)
};
