import { relative } from "node:path";

export type Location = {
	column: number;
	file: string;
	line: number;
	link: string;
	module: string;
};

type CreateLocatorInput = Pick<Location, "file" | "link" | "module"> & {
	code: string;
	path: string;
};

/**
 * Creates a locator for SDK usages in a source file.
 *
 * @param input - Source file and its package metadata.
 * @param input.code - Source text.
 * @param input.file - Absolute source file path.
 * @param input.link - Repository link.
 * @param input.module - Package name.
 * @param input.path - Root path that the reported file is relative to.
 * @returns A function that reports a usage's source location and package metadata.
 */
export const createLocator = ({ code, file, link, module, path }: CreateLocatorInput) => {
	const source = Buffer.from(code);
	const lineStarts = [0];
	const relativeFile = `./${relative(path, file)}`;

	for (let index = source.indexOf("\n"); index !== -1; index = source.indexOf("\n", index + 1)) {
		lineStarts.push(index + 1);
	}

	return (offset: number): Location => {
		const line = Math.max(
			1,
			lineStarts.findLastIndex((lineStart) => {
				return lineStart <= offset;
			}) + 1,
		);

		return {
			column: source.toString("utf8", lineStarts[line - 1], offset).length,
			file: relativeFile,
			line,
			link,
			module,
		};
	};
};
