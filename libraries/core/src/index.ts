import { readFileSync } from "fs";

import { require, resolvePackageJson } from "./helpers";
import { createItem } from "./modules/item";
import type { Item } from "./modules/item";
import { parse } from "./modules/parser";
import { jsxElementPlugin, typePlugin } from "./modules/plugin";
import { scan } from "./modules/scanner";
import type { ScanOptions } from "./modules/scanner";
import type { Package } from "./types";

type Options = Partial<
	Pick<ScanOptions, "excludeFolders" | "includeFiles"> & {
		/**
		 * Only analyze components imported from the specificied module list.
		 */
		includeModules: string[];
	}
>;

export const esusage = async (path: string, options: Options = {}) => {
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
			const code = readFileSync(file, "utf-8");

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
				plugins: [jsxElementPlugin, typePlugin],
			});
		}
	}

	return items;
};
