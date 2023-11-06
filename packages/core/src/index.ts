import { readFileSync } from "fs";

import { createItem } from "./entities/item";
import type { Item } from "./entities/item";
import { createLocation } from "./entities/location";
import { parse } from "./features/parse";
import { scan } from "./features/scan";

export const esonar = async () => {
	const projects = scan();
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
						}),
					}),
				);
			});
		}
	}

	return items;
};
