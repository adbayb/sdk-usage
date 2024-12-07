import process from "node:process";

import typescriptSyntaxPlugin from "@sdk-usage/plugin-syntax-typescript";
import jsxSyntaxPlugin from "@sdk-usage/plugin-syntax-jsx";
import { createContext } from "@sdk-usage/core";

const context = createContext(process.cwd(), {
	plugins: { syntax: [jsxSyntaxPlugin, typescriptSyntaxPlugin] },
});

const main = async () => {
	const items = await context.getItems();

	console.log(JSON.stringify(items, null, 2), items.length);
};

void main();
