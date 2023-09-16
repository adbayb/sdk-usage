import type { Item } from "./entities/item";

type Metadata = {
	source: string; // URL (if VCS) or filesystem path for the currently analyzed project
};

/**
 * Plugins introduce only external side effects without having control over internal side effects
 * to not introduce weird behaviors if multiple plugins are composed together
 * @example instance counter, elasticsearch put op, ...
 */
export type Plugin = {
	onStart: (metadata: Metadata) => void; // For initial operations (eg. setting up the initial context)
	onCollect: (item: Item) => void; // For atomic operations on a single item (eg. rest calls, specific item alteration, ...)
	onEnd: (items: Item[]) => void; // For global operations on all items (eg. managing write operations, clean up, or even reducing items to count elements, ...)
};
