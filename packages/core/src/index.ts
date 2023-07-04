import type { Location, Output, Parser, ParserMethods } from "./types";
import { EXAMPLE_SOLID } from "./constants";
import { parser } from "./parser";

const createFallbackToken = (value: string) => `#${value}`; // Preserve unrecognized tokens and flag them by prefixing with `#`

const createLocation = (code: string, offset: number): Location => {
	const linesTillOffset = code.substring(0, offset).split(/\n/);
	const line = linesTillOffset.length;
	const column = (linesTillOffset[line - 1] as string).length;

	return {
		column,
		line,
		file: import.meta.url,
		module: "",
	};
};

const main = async (parser: Parser) => {
	const code = EXAMPLE_SOLID;
	const createItem: ParserMethods["createItem"] = ({
		offset,
		module,
		name,
		type,
		args,
	}) => {
		return {
			name,
			type,
			module,
			version: "",
			args,
			location: createLocation(code, offset),
		};
	};

	const output: Output = {
		createdAt: new Date().toISOString(),
		source: process.cwd(),
		data: await parser.parse(code, { createItem, createFallbackToken }),
	};

	console.log(JSON.stringify(output, null, 2));
};

// @todo: make output file configurable
main(parser);
