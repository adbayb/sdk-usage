import { relative } from "node:path";

export type Location = {
	column: number;
	file: string;
	line: number;
	link: string;
	module: string;
};

export type CreateLocationInput = Pick<Location, "file" | "link" | "module"> & {
	code: string;
	offset: number;
	path: string;
};

export const createLocation = ({
	code,
	file,
	link,
	module,
	offset,
	path,
}: CreateLocationInput) => {
	const linesTillOffset = code.slice(0, Math.max(0, offset)).split(/\n/);
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
