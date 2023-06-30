import type { Location, Output, Parser, ParserMethods } from "./types";
import { EXAMPLE_REACT } from "./constants";
import { parser } from "./parsers/swc";

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
	const code = EXAMPLE_REACT;
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
		items: await parser.parse(code, { createItem, createFallbackToken }),
	};

	console.log(JSON.stringify(output, null, 2));
};

main(parser);
