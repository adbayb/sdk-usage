import { existsSync, readFileSync } from "fs";
import { createRequire } from "node:module";
import { join } from "node:path";

import { CWD } from "./constants";
import { createItem } from "./modules/item";
import type { Item } from "./modules/item";
import { parse } from "./modules/parser";
import { scan } from "./modules/scanner";
import type { ScanOptions } from "./modules/scanner";
import type { Package } from "./types";

const require = createRequire(import.meta.url);

type ConfigurationOptions = Partial<
	Pick<ScanOptions, "excludeFolders" | "includeFiles" | "path">
>;

const resolvePackageJson = (fromPath: string): string => {
	const filepath = join(fromPath, "./package.json");

	if (existsSync(filepath)) {
		return filepath;
	}

	return resolvePackageJson(join(fromPath, "../"));
};

export const esonar = async (options: ConfigurationOptions = {}) => {
	const path = options.path ?? CWD;

	const projects = scan({
		path,
	});

	const items: Item[] = [];

	for (const project of projects) {
		const module = project.metadata.name;

		for (const file of project.files) {
			const code = readFileSync(file, "utf-8");

			await parse(code, (item) => {
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
					version = "";
				}

				items.push(
					createItem({
						...item,
						// @todo: Git origin URL if available
						location: {
							code,
							file,
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
