import process from "node:process";

import typescriptSyntaxPlugin from "@sdk-usage/plugin-typescript";
import jsxSyntaxPlugin from "@sdk-usage/plugin-jsx";
import { createInstance } from "@sdk-usage/core";

const instance = createInstance(process.cwd(), {
	plugins: [jsxSyntaxPlugin, typescriptSyntaxPlugin],
});

const main = async () => {
	const items = await instance.getItems();

	console.log(JSON.stringify(items, null, 2), items.length);
};

void main();
