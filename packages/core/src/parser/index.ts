import type { Context } from "../entities/context";
import type { Import } from "../entities/import";
import type { Item } from "../entities/item";
import { createItem } from "../entities/item";

import { parser } from "./adapters/swc";

type Metadata = Context & Pick<Item["location"], "file">;

export const parse = async (code: string, { file, pkg, root }: Metadata) => {
	const items: Item[] = [];
	const imports = new Map<Import["alias"], Import>();

	await parser.execute(code, {
		onAddingItem: (item) => {
			items.push(
				createItem({
					...item,
					code,
					file,
					root,
					pkg: {
						name: pkg.name,
						version: pkg.version,
					},
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
