type Node = { type: string };

export const traverse = <
	Target extends NodeMapper[string],
	NodeMapper extends Record<string, Node>,
>(
	node: Target,
	visitor: {
		[Key in keyof NodeMapper]?: (node: NodeMapper[Key]) => void;
	},
) => {
	if (isNode(node)) {
		const visit = visitor[node.type];

		if (typeof visit === "function") {
			visit(node);
		}
	}

	for (const key of Object.keys(node)) {
		const child = node[key as keyof Target] as
			| (NodeMapper[string] | null | undefined)[]
			| NodeMapper[string]
			| null
			| undefined;

		if (Array.isArray(child)) {
			for (const item of child) {
				if (isObject(item)) traverse(item, visitor);
			}

			continue;
		}

		if (isObject(child)) {
			traverse(child, visitor);
		}
	}
};

const isNode = (value: unknown): value is Node => {
	return isObject(value) && "type" in value;
};

const isObject = (value: unknown): value is object => {
	return value !== null && typeof value === "object";
};
