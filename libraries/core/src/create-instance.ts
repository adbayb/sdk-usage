import { readFileSync } from "node:fs";
import type { Item } from "./entities/item";
import { createItem } from "./entities/item";
import { require, resolvePackageJson } from "./helpers";
import { parse } from "./modules/parser";
import type { Plugin } from "./modules/plugin";
import type { ScanOptions } from "./modules/scanner";
import { scan } from "./modules/scanner";
import type { Package } from "./types";

type Options = Partial<
	Pick<ScanOptions, "excludeFolders" | "includeFiles"> & {
		/** Only analyze components imported from the specificied module list. */
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

export const createInstance = (path: string, options: Options) => {
	const { includeModules, plugins, resolveInstalledVersions } = options;

	return {
		async getItems() {
			const projects = await scan(path);
			const items: Item[] = [];

			for (const project of projects) {
				const module = project.metadata.name;

				const dependencies = {
					...project.metadata.devDependencies,
					...project.metadata.optionalDependencies,
					...project.metadata.dependencies,
				};

				const { link } = project;

				for (const file of project.files) {
					const code = readFileSync(file, "utf8");

					await parse(code, {
						onAdd(item) {
							const { module: itemModule, offset } = item;

							if (
								includeModules &&
								includeModules.length > 0 &&
								!includeModules.includes(itemModule)
							) {
								return;
							}

							let version = dependencies[itemModule] ?? "";

							if (resolveInstalledVersions) {
								try {
									const { version: installedVersion } = require(
										resolvePackageJson(
											require.resolve(itemModule, {
												paths: [file],
											}),
										),
									) as Package;

									version = installedVersion;
								} catch {
									// @TODO: No operation (later warnings can be added).
								}
							}

							items.push(
								createItem({
									...item,
									location: {
										code,
										file,
										link,
										module,
										offset,
										path,
									},
									version,
								}),
							);
						},
						plugins: plugins ?? [],
					});
				}
			}

			return items;
		},
	};
};
