import { fdir } from "fdir";
import { dirname } from "node:path";
import { createRequire } from "node:module";

import { CWD } from "../constants";

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
			const metadata = require(path) as {
				name: string;
				version: string;
				description: string;
				dependencies?: Record<string, string>;
				devDependencies?: Record<string, string>;
				peerDependencies?: Record<string, string>;
				optionalDependencies?: Record<string, string>;
			};

			return { metadata, folder: dirname(path) };
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
