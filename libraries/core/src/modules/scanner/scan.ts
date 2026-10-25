import { dirname } from "node:path";
import { fdir as Fdir } from "fdir";
import { exec, require } from "../../helpers";
import type { Package } from "../../types";

export type ScanOptions = {
	/** A list of folders to ignore. */
	excludeFolders?: string[];
	/** A list of files to include (following glob matcher). */
	includeFiles?: string[];
};

export const scan = async (path: string, options: ScanOptions = {}) => {
	const excludedFolders = options.excludeFolders ?? DEFAULT_EXCLUDED_FOLDERS;
	const includedFiles = options.includeFiles ?? DEFAULT_INCLUDED_FILES;

	const projectPaths = new Fdir()
		.withBasePath()
		.glob("**/package.json")
		.exclude((directoryName) => {
			return excludedFolders.includes(directoryName);
		})
		.crawl(path)
		.sync();

	const projects: { metadata: Package; folder: string; link: string }[] = [];

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

		projects.push({ metadata, folder, link });
	}

	return projects.map((project) => {
		const files: string[] = new Fdir()
			.withBasePath()
			.glob(...includedFiles)
			.exclude((directoryName) => {
				return excludedFolders.includes(directoryName);
			})
			.crawl(project.folder)
			.sync();

		return Object.assign(project, { files });
	});
};

const DEFAULT_EXCLUDED_FOLDERS = [".git", "node_modules", "dist", "out"];

const DEFAULT_INCLUDED_FILES = [
	"**/*/!(test|*.test|stories|*.stories).?(m){j,t}s?(x)", // Js|jsx|ts|tsx|cjs|mjs|cjsx|mjsx excluding test-like and story-like files
];
