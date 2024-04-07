import { existsSync, readFileSync } from "fs";
import { createRequire } from "node:module";
import { join } from "node:path";

import { createItem } from "./modules/item";
import type { Item } from "./modules/item";
import { parse } from "./modules/parser";
import { scan } from "./modules/scanner";
import type { ScanOptions } from "./modules/scanner";
import type { Package } from "./types";

const require = createRequire(import.meta.url);

type ConfigurationOptions = Partial<
	Pick<ScanOptions, "excludeFolders" | "includeFiles">
> & {
	/**
	 * Only analyze components imported from the specificied module list.
	 * @default []
	 */
	includeModules?: string[];
};

const resolvePackageJson = (fromPath: string): string => {
	const filepath = join(fromPath, "./package.json");

	if (existsSync(filepath)) {
		return filepath;
	}

	return resolvePackageJson(join(fromPath, "../"));
};

export const analyze = async (
	path: string,
	options: ConfigurationOptions = {},
) => {
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

			await parse(code, (item) => {
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
			});
		}
	}

	return items;
};
