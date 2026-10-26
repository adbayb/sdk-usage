import { opendir, readFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import type { Readable } from "node:stream";
import picomatch from "picomatch";
import { exec } from "../../helpers";
import type { Package } from "../../types";
import { createObjectStream } from "../create-object-stream";

export type ScannedFile = {
	metadata: Package;
	file: string;
	link: string;
};

export type ScanOptions = {
	/** A list of folders to ignore. */
	excludeFolders?: string[];
	/** A list of files to include (following glob matcher). */
	includeFiles?: string[];
};

const DEFAULT_EXCLUDED_FOLDERS = [".git", "node_modules", "dist", "out"];

const DEFAULT_INCLUDED_FILES = [
	"**/*/!(test|*.test|stories|*.stories).?(m){j,t}s?(x)", // Js|jsx|ts|tsx|cjs|mjs|cjsx|mjsx excluding test-like and story-like files
];

/**
 * Streams matching source files from each package under `path`.
 *
 * Directory entries and results are consumed lazily so callers control how quickly scanning
 * advances.
 *
 * @param path - Root directory to scan.
 * @param options - File and folder filters.
 * @returns A backpressure-aware stream of matching source files and package metadata.
 */
export const scan = (
	path: string,
	options: ScanOptions = {},
): AsyncIterable<ScannedFile> & Omit<Readable, typeof Symbol.asyncIterator> => {
	const excludedFolders = new Set(options.excludeFolders ?? DEFAULT_EXCLUDED_FOLDERS);
	const matchesFile = picomatch(options.includeFiles ?? DEFAULT_INCLUDED_FILES, { dot: true });

	return createObjectStream(async (emit, signal) => {
		return scanDirectory(path, undefined, excludedFolders, matchesFile, emit, signal);
	});
};

const scanDirectory = async (
	folder: string,
	parentProject: Project | undefined,
	excludedFolders: Set<string>,
	matchesFile: (path: string) => boolean,
	emit: (file: ScannedFile) => Promise<void>,
	signal: AbortSignal,
): Promise<void> => {
	const project = (await getProject(folder)) ?? parentProject;
	const directory = await opendir(folder);

	for await (const entry of directory) {
		signal.throwIfAborted();

		if (entry.isDirectory()) {
			if (!excludedFolders.has(entry.name)) {
				await scanDirectory(
					join(folder, entry.name),
					project,
					excludedFolders,
					matchesFile,
					emit,
					signal,
				);
			}

			continue;
		}

		if (!project || (!entry.isFile() && !entry.isSymbolicLink())) {
			continue;
		}

		const file = join(folder, entry.name);
		const relativeFile = relative(project.folder, file).split(sep).join("/");

		if (matchesFile(relativeFile)) {
			await emit({ metadata: project.metadata, file, link: project.link });
		}
	}
};

const getProject = async (folder: string): Promise<Project | undefined> => {
	const packagePath = join(folder, "package.json");
	let packageContent: string;

	try {
		packageContent = await readFile(packagePath, "utf8");
	} catch (error) {
		if (error instanceof Error && "code" in error && error.code === "ENOENT") {
			return undefined;
		}

		throw error;
	}

	const metadata = JSON.parse(packageContent) as Package;
	let link: string;

	try {
		link = await exec("git config --get remote.origin.url", { cwd: folder });
	} catch {
		link = "";
	}

	return { metadata, folder, link };
};

type Project = {
	metadata: Package;
	folder: string;
	link: string;
};
