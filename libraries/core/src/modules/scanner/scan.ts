import type { Dirent } from "node:fs";
import { opendir, readFile } from "node:fs/promises";
import { join, matchesGlob, relative, sep } from "node:path";
import { Readable } from "node:stream";
import { exec } from "../../helpers";
import type { Package } from "../../types";

export type ScannedFile = Project & { file: string };

export type ScanOptions = {
	/** A list of folders to ignore. */
	excludeFolders?: string[];
	/**
	 * Include patterns using `node:path.matchesGlob` semantics. Dot-prefixed path segments must be
	 * matched explicitly; leading `!` is not negation.
	 */
	includeFiles?: string[];
};

const DEFAULT_EXCLUDED_FOLDERS = [".git", "node_modules", "dist", "out"];

const DEFAULT_INCLUDED_FILES = [
	"**/*/!(test|*.test|stories|*.stories).?(m){j,t}s?(x)", // Includes js|jsx|ts|tsx|cjs|mjs|cjsx|mjsx files outside test-like and story-like ones
];

/**
 * Finds matching source files in the package tree at `path`.
 *
 * @param path - Root directory to scan.
 * @param signal - Cancels the scan.
 * @param options - File and folder filters.
 * @returns A backpressure-aware stream of matching source files and their package metadata.
 */
export const scan = (
	path: string,
	signal: AbortSignal,
	options: ScanOptions,
): AsyncIterable<ScannedFile> & Omit<Readable, typeof Symbol.asyncIterator> => {
	const excludedFolders = new Set(options.excludeFolders ?? DEFAULT_EXCLUDED_FOLDERS);
	const includedFiles = options.includeFiles ?? DEFAULT_INCLUDED_FILES;

	const isIncluded = (file: string, project: Project) => {
		const relativeFile = relative(project.folder, file).replaceAll(sep, "/");

		return includedFiles.some((pattern) => {
			return matchesGlob(relativeFile, pattern);
		});
	};

	const scanDirectory = (folder: string, parentProject?: Project): Readable => {
		// Defer I/O until the directory is consumed.
		return Readable.from([folder]).flatMap(async () => {
			const project = (await getProject(folder)) ?? parentProject;

			return Readable.from(await opendir(folder)).flatMap(
				// oxlint-disable-next-line unicorn/no-array-method-this-argument -- Node stream options.
				(entry: Dirent) => {
					const file = join(folder, entry.name);

					if (entry.isDirectory() && excludedFolders.has(entry.name)) {
						return [];
					}

					if (entry.isDirectory()) {
						return scanDirectory(file, project);
					}

					const isSourceFile = entry.isFile() || entry.isSymbolicLink();

					if (!project || !isSourceFile || !isIncluded(file, project)) {
						return [];
					}

					return [{ ...project, file }];
				},
				{ signal },
			);
		});
	};

	return scanDirectory(path);
};

type Project = {
	metadata: Package;
	folder: string;
	link: string;
};

const getProject = async (folder: string): Promise<Project | undefined> => {
	try {
		const content = await readFile(join(folder, "package.json"), "utf8");
		const metadata = JSON.parse(content) as Package;

		const link = await exec("git config --get remote.origin.url", { cwd: folder }).catch(() => {
			return "";
		});

		return { metadata, folder, link };
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") {
			return undefined;
		}

		throw error;
	}
};
