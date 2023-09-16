import type { Import } from "../entities/import";
import type { Item } from "../entities/item";

export type Parser = {
	id: string;
	execute: (
		code: string,
		callbacks: {
			onAddingItem: (
				item: Pick<Item, "args" | "module" | "name" | "type"> & {
					offset: number;
				},
			) => void;
			onGettingImport: (name: Import["name"]) => Import | undefined;
			onSettingImport: (data: Import) => void;
		},
	) => Promise<void>;
};

export type Primitive = bigint | boolean | number | string | null | undefined;
