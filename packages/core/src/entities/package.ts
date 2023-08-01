export type Package = {
	name: string;
	version: string;
	dependencies: Map<string, string>;
};
