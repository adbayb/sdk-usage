import { fdir } from "fdir";
import { createRequire } from "node:module";
import { dirname } from "node:path";

import { CWD } from "../constants";
import type { Package } from "../entities/package";

const require = createRequire(import.meta.url);

export type ScannerOptions = {
	/**
	 * A list of folders to ignore
	 */
	excludeFolders?: string[];
	/**
	 * A list of files to include (following glob matcher)
	 */
	includeFiles?: string[];
};

export const scan = (options: ScannerOptions = {}) => {
	const excludedFolders = options.excludeFolders ?? DEFAULT_EXCLUDED_FOLDERS;
	const includedFiles = options.includeFiles ?? DEFAULT_INCLUDED_FILES;

	const projects = new fdir()
		.withBasePath()
		.glob("**/package.json")
		.exclude((dirName) => excludedFolders.includes(dirName))
		.crawl(CWD)
		.sync()
		.map((path) => {
			const metadata = require(path) as Package;

			return { folder: dirname(path), metadata };
		});

	return projects.map((project) => {
		const files: string[] = new fdir()
			.withBasePath()
			.glob(...includedFiles)
			.exclude((dirName) => excludedFolders.includes(dirName))
			.crawl(project.folder)
			.sync();

		return { ...project, files };
	});
};

const DEFAULT_EXCLUDED_FOLDERS = [".git", "node_modules", "dist", "out"];

const DEFAULT_INCLUDED_FILES = [
	"**/*/!(test|*.test|stories|*.stories).?(m){j,t}s?(x)", // js|jsx|ts|tsx|cjs|mjs|cjsx|mjsx excluding test-like and story-like files
];
