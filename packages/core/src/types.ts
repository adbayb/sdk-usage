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
	parse(code: string, methods: ParserMethods): Promise<Array<Item>>;
};

export type Primitive = string | boolean | undefined | null | bigint | number;

export type Output = Metadata & {
	data: Array<Item>;
};

type Metadata = {
	createdAt: string;
	source: string; // URL (if VCS) or filesystem path for the currently analyzed project
};

export type Location = {
	file: string;
	line: number;
	column: number;
	module: string;
};

export type Item = {
	name: string;
	module: string;
	version: string;
	type: "component" | "type" | "method" | "variable" | "unknown";
	location: Location;
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
	onStart(metadata: Metadata): void; // eg. For setting up the initial context
	onCollect(item: Item): void; // eg. For rest calls, count processing, ...
	onEnd(output: Output): void; // eg. For managing write operations, clean up, ...
};
