import { readFileSync } from "fs";

import { scan } from "./scanner";
import type { Item } from "./entities/item";
import { parse } from "./parser";

export const esonar = async () => {
	const projects = scan();
	const items: Item[] = [];

	for (const project of projects) {
		for (const file of project.files) {
			const content = readFileSync(file, "utf-8");
			const module = project.metadata.name;

			const projectItems = await parse(content, {
				file,
				module,
			});

			items.push(...projectItems);
		}
	}

	console.log(items);
};
