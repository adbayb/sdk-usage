import type { Import } from "../entities/import";
import type { Item } from "../entities/item";
import { createItem } from "../entities/item";
import type { Location } from "../entities/location";
import { createLocation } from "../entities/location";

import { parser } from "./adapters/swc";

type Context = Pick<Location, "file" | "module">;

export const parse = async (code: string, context: Context) => {
	const items: Item[] = [];
	const imports = new Map<Import["alias"], Import>();

	await parser.execute(code, {
		onAddingItem: ({ module, name, offset, type, args }) => {
			items.push(
				createItem({
					args,
					module,
					name,
					type,
					location: createLocation({
						code,
						offset,
						file: context.file,
						module: context.module,
					}),
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
