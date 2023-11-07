import { readFileSync } from "fs";

import { CWD } from "./constants";
import { createItem } from "./entities/item";
import type { Item } from "./entities/item";
import { createLocation } from "./entities/location";
import { parse } from "./features/parse";
import { scan } from "./features/scan";
import type { ScanOptions } from "./features/scan";

type ConfigurationOptions = Partial<
	Pick<ScanOptions, "excludeFolders" | "includeFiles" | "path">
>;

export const esonar = async (options: ConfigurationOptions = {}) => {
	const path = options.path ?? CWD;

	const projects = scan({
		path,
	});

	const items: Item[] = [];

	for (const project of projects) {
		for (const file of project.files) {
			const code = readFileSync(file, "utf-8");
			const module = project.metadata.name;

			await parse(code, (item) => {
				items.push(
					createItem({
						// @todo: Version
						...item,
						// @todo: Git origin URL if available
						location: createLocation({
							code,
							file,
							module,
							offset: item.offset,
							path,
						}),
					}),
				);
			});
		}
	}

	return items;
};
