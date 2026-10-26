import { readFile } from "node:fs/promises";
import type { Readable } from "node:stream";
import type { Item } from "./entities/item";
import { createItem } from "./entities/item";
import { require, resolvePackageJson } from "./helpers";
import { createObjectStream } from "./modules/create-object-stream";
import { parse } from "./modules/parser";
import type { Plugin } from "./modules/plugin";
import type { ScannedFile, ScanOptions } from "./modules/scanner";
import { scan } from "./modules/scanner";
import type { Package } from "./types";

type Options = Partial<
	Pick<ScanOptions, "excludeFolders" | "includeFiles"> & {
		/** Only analyze components imported from the specified module list. */
		includeModules: string[];
		/** A list of plugins to enable. */
		plugins: Plugin[];
		/**
		 * Attempt to resolve installed versions of modules. If false or not possible, the specified
		 * version from the package.json will be used.
		 *
		 * @default false
		 */
		resolveInstalledVersions: boolean;
	}
>;

/**
 * Creates an analyzer for the package tree at `path`.
 *
 * @param path - Root directory to scan.
 * @param options - Optional file filters, module filters, and parser plugins.
 * @returns An analyzer that streams matching SDK usage.
 */
export const createInstance = (path: string, options: Options) => {
	const { includeModules, plugins, resolveInstalledVersions } = options;

	return {
		/**
		 * Lazily scans the configured package tree and streams each matching SDK usage.
		 *
		 * @returns A backpressure-aware stream of matching SDK usages.
		 */
		getItems(): AsyncIterable<Item> & Omit<Readable, typeof Symbol.asyncIterator> {
			return createObjectStream(async (emit, signal) => {
				const files = scan(path, options);

				const stopScanning = () => {
					files.destroy();
				};

				signal.addEventListener("abort", stopScanning, { once: true });

				try {
					for await (const projectFile of files) {
						signal.throwIfAborted();

						await emitProjectItems({
							emit,
							includeModules,
							path,
							plugins,
							projectFile,
							resolveInstalledVersions,
							signal,
						});
					}
				} finally {
					signal.removeEventListener("abort", stopScanning);
				}
			});
		},
	};
};

const emitProjectItems = async ({
	emit,
	includeModules,
	path,
	plugins,
	projectFile,
	resolveInstalledVersions,
	signal,
}: {
	emit: (item: Item) => Promise<void>;
	includeModules: string[] | undefined;
	path: string;
	plugins: Plugin[] | undefined;
	projectFile: ScannedFile;
	resolveInstalledVersions: boolean | undefined;
	signal: AbortSignal;
}) => {
	const module = projectFile.metadata.name;

	const dependencies = {
		...projectFile.metadata.devDependencies,
		...projectFile.metadata.optionalDependencies,
		...projectFile.metadata.dependencies,
	};

	const code = await readFile(projectFile.file, "utf8");

	signal.throwIfAborted();

	const parsedItems = parse(code, {
		file: projectFile.file,
		plugins: plugins ?? [],
	});

	const stopParsing = () => {
		parsedItems.destroy();
	};

	signal.addEventListener("abort", stopParsing, { once: true });

	try {
		for await (const item of parsedItems) {
			signal.throwIfAborted();

			const { module: itemModule, offset } = item;

			if (
				includeModules &&
				includeModules.length > 0 &&
				!includeModules.includes(itemModule)
			) {
				continue;
			}

			const version =
				(resolveInstalledVersions
					? getInstalledVersion(itemModule, projectFile.file)
					: undefined) ??
				dependencies[itemModule] ??
				"";

			await emit(
				createItem({
					...item,
					location: {
						code,
						file: projectFile.file,
						link: projectFile.link,
						module,
						offset,
						path,
					},
					version,
				}),
			);
		}
	} finally {
		signal.removeEventListener("abort", stopParsing);
	}
};

const getInstalledVersion = (module: string, file: string) => {
	try {
		const { version } = require(
			resolvePackageJson(
				require.resolve(module, {
					paths: [file],
				}),
			),
		) as Package;

		return version;
	} catch {
		// @TODO: No operation (later warnings can be added).
		return undefined;
	}
};
