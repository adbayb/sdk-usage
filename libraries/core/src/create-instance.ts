import { readFile } from "node:fs/promises";
import type { Item } from "./entities/item";
import { createItem, createLocator } from "./entities/item";
import { require, resolvePackageJson } from "./helpers";
import { parse } from "./modules/parser";
import type { Plugin } from "./modules/plugin";
import type { ScannedFile, ScanOptions } from "./modules/scanner";
import { scan } from "./modules/scanner";
import type { Package } from "./types";

type Options = Partial<
	ScanOptions & {
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
 * @returns An analyzer that collects matching SDK usages.
 */
export const createInstance = (path: string, options: Options) => {
	const { includeModules = [], plugins = [], resolveInstalledVersions = false } = options;

	const getFileItems = async ({ metadata, file, link }: ScannedFile, signal: AbortSignal) => {
		const code = await readFile(file, { encoding: "utf8", signal });
		const items = await parse(code, { file, plugins });
		const locate = createLocator({ code, file, link, module: metadata.name, path });

		const dependencies = {
			...metadata.devDependencies,
			...metadata.optionalDependencies,
			...metadata.dependencies,
		};

		return items
			.filter(({ module }) => {
				return includeModules.length === 0 || includeModules.includes(module);
			})
			.map((item) => {
				const version =
					(resolveInstalledVersions
						? getInstalledVersion(item.module, file)
						: undefined) ??
					dependencies[item.module] ??
					"";

				return createItem({ ...item, location: locate(item.offset), version });
			});
	};

	return {
		/**
		 * Collects matching SDK usages from the package tree. Stopping iteration cancels pending
		 * scans; scans already in progress may finish.
		 *
		 * @returns An async iterable of matching SDK usages with their source locations and
		 *   versions.
		 */
		getItems(): AsyncIterable<Item> {
			const controller = new AbortController();
			const { signal } = controller;

			const iterator = scan(path, signal, options)
				.flatMap(async (file: ScannedFile) => {
					return getFileItems(file, signal);
				})
				.iterator();

			const items: AsyncIterableIterator<Item> = {
				next: iterator.next.bind(iterator),
				async return() {
					controller.abort();
					await iterator.return?.();

					return { done: true, value: undefined };
				},
				[Symbol.asyncIterator]() {
					return this;
				},
			};

			return items;
		},
	};
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
		// TODO: No operation (later warnings can be added).
		return undefined;
	}
};
