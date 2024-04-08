import { fdir } from "fdir";
import { dirname } from "node:path";

import { exec, require } from "../../helpers";
import type { Package } from "../../types";

export type ScanOptions = {
	/**
	 * A list of folders to ignore.
	 */
	excludeFolders?: string[];
	/**
	 * A list of files to include (following glob matcher).
	 */
	includeFiles?: string[];
};

export const scan = async (path: string, options: ScanOptions = {}) => {
	const excludedFolders = options.excludeFolders ?? DEFAULT_EXCLUDED_FOLDERS;
	const includedFiles = options.includeFiles ?? DEFAULT_INCLUDED_FILES;

	const projectPaths = new fdir()
		.withBasePath()
		.glob("**/package.json")
		.exclude((dirName) => excludedFolders.includes(dirName))
		.crawl(path)
		.sync();

	const projects: { folder: string; link: string; metadata: Package }[] = [];

	for (const projectPath of projectPaths) {
		const metadata = require(projectPath) as Package;
		const folder = dirname(projectPath);
		let link: string;

		try {
			link = await exec("git config --get remote.origin.url", {
				cwd: folder,
			});
		} catch {
			link = "";
		}

		projects.push({ folder, link, metadata });
	}

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
