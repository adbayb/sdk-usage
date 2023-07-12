import type { Item, ParserMethods } from "./types";
import { EXAMPLE_SOLID } from "./constants";
import { parser } from "./parser";

const createFallbackToken = (value: string) => `#${value}`; // Preserve unrecognized tokens and flag them by prefixing with `#`

const createPosition = (code: string, offset: number) => {
	const linesTillOffset = code.substring(0, offset).split(/\n/);
	const line = linesTillOffset.length;
	const column = (linesTillOffset[line - 1] as string).length;

	return {
		column,
		line,
	};
};

interface Context {
	project: string;
	dependencies: Map<string, string>;
	module?: string;
}

export const parse = async (code: string, context: Context) => {
	const createItem: ParserMethods["createItem"] = ({
		offset,
		module,
		name,
		type,
		args,
	}) => {
		const version = context.dependencies.get(module);
		const location = {
			...createPosition(code, offset),
			project: context.project,
			file: "./index.ts",
		};
		const item: Item = {
			createdAt: new Date().toISOString(),
			name,
			type,
			module,
			args,
			location,
		};

		if (version) {
			item.version = version;
		}

		if (context.module) {
			item.location.module = context.module;
		}

		return item;
	};

	const output = await parser.execute(code, {
		createItem,
		createFallbackToken,
	});

	console.log(JSON.stringify(output, null, 2));

	return output;
};

// @todo: make output file configurable
parse(EXAMPLE_SOLID, {
	project: process.cwd(),
	dependencies: new Map([
		["@suid/material", "1.0.0"],
		["solid-js", "2.0.0"],
	]),
});
