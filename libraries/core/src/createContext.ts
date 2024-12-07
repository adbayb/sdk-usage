import { readFileSync } from "node:fs";

import type { Package } from "./types";
import { scan } from "./modules/scanner";
import type { ScanOptions } from "./modules/scanner";
import { parse } from "./modules/parser";
import type { ParseOptions } from "./modules/parser";
import { require, resolvePackageJson } from "./helpers";
import { createItem } from "./entities/item";
import type { Item } from "./entities/item";

type Options = Partial<
	Pick<ScanOptions, "excludeFolders" | "includeFiles"> & {
		/**
		 * Only analyze components imported from the specificied module list.
		 */
		includeModules: string[];
	}
> &
	Pick<ParseOptions, "plugins">;

export const createContext = (path: string, options: Options) => {
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

				const link = project.link;

				for (const file of project.files) {
					const code = readFileSync(file, "utf8");

					await parse(code, {
						onAdd(item) {
							if (
								options.includeModules &&
								options.includeModules.length > 0 &&
								!options.includeModules.includes(item.module)
							) {
								return;
							}

							let version: string;

							try {
								version = (
									require(
										resolvePackageJson(
											require.resolve(item.module, {
												paths: [file],
											}),
										),
									) as Package
								).version;
							} catch {
								version = dependencies[item.module] ?? "";
							}

							items.push(
								createItem({
									...item,
									location: {
										code,
										file,
										link,
										module,
										offset: item.offset,
										path,
									},
									version,
								}),
							);
						},
						plugins: options.plugins,
					});
				}
			}

			return items;
		},
	};
};
