import { relative } from "node:path";

export type Location = {
	column: number;
	file: string;
	line: number;
	module: string;
};

export const createLocation = ({
	code,
	file,
	module,
	offset,
	path,
}: Pick<Location, "file" | "module"> & {
	code: string;
	offset: number;
	path: string;
}) => {
	const linesTillOffset = code.substring(0, offset).split(/\n/);
	const line = linesTillOffset.length;
	const column = (linesTillOffset[line - 1] as string).length;

	return {
		column,
		file: `./${relative(path, file)}`,
		line,
		module,
	};
};
