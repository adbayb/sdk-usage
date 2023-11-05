import { relative } from "node:path";

import { CWD } from "../constants";

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
}: Pick<Location, "file" | "module"> & {
	code: string;
	offset: number;
}) => {
	const linesTillOffset = code.substring(0, offset).split(/\n/);
	const line = linesTillOffset.length;
	const column = (linesTillOffset[line - 1] as string).length;

	return {
		column,
		file: `./${relative(CWD, file)}`,
		line,
		module,
	};
};
