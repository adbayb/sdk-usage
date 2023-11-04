import type { Import } from "../entities/import";
import type { Item } from "../entities/item";
import { createItem } from "../entities/item";

import { parser } from "./adapters/swc";

type Metadata = Pick<Item["location"], "file">;

export const parse = async (code: string, { file }: Metadata) => {
	const items: Item[] = [];
	const imports = new Map<Import["alias"], Import>();

	await parser.execute(code, {
		onAddingItem: (item) => {
			items.push(
				createItem({
					...item,
					code,
					file,
				}),
			);
		},
		onGettingImport(name) {
			return imports.get(name);
		},
		onSettingImport(data) {
			imports.set(data.alias, data);
		},
	});

	return items;
};
