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
	items: Array<Item>;
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
