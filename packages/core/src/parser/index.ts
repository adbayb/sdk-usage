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
		onAddingItem: ({ name, args, module, offset, type }) => {
			items.push(
				createItem({
					name,
					args,
					location: createLocation({
						code,
						file: context.file,
						module: context.module,
						offset,
					}),
					module,
					type,
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
