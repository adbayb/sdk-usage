import { relative } from "node:path";

const NEWLINE_PATTERN = /\n/u;

export type CreateLocationInput = Pick<Location, "file" | "link" | "module"> & {
	code: string;
	offset: number;
	path: string;
};

export type Location = {
	column: number;
	file: string;
	line: number;
	link: string;
	module: string;
};

export const createLocation = ({ code, file, link, module, offset, path }: CreateLocationInput) => {
	const codeUnitOffset = Buffer.from(code)
		.subarray(0, Math.max(0, offset))
		.toString("utf8").length;

	const linesTillOffset = code.slice(0, codeUnitOffset).split(NEWLINE_PATTERN);
	const line = linesTillOffset.length;
	const column = (linesTillOffset[line - 1] as string).length;

	return {
		column,
		file: `./${relative(path, file)}`,
		line,
		link,
		module,
	};
};
