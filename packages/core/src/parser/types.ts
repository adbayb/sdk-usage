import { Import } from "../entities/import";
import { Item } from "../entities/item";

export type Parser = {
	id: string;
	execute(
		code: string,
		callbacks: {
			onAddingItem: (
				item: Pick<Item, "module" | "name" | "args" | "type"> & {
					offset: number;
				}
			) => void;
			onGettingImport: (name: Import["name"]) => Import | undefined;
			onSettingImport: (data: Import) => void;
		}
	): Promise<void>;
};

export type Primitive = string | boolean | undefined | null | bigint | number;
