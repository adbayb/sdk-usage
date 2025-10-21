import typescriptPlugin from "@sdk-usage/plugin-typescript";
import jsxPlugin from "@sdk-usage/plugin-jsx";
import { createInstance } from "@sdk-usage/core";

const instance = createInstance(process.cwd(), {
	plugins: [jsxPlugin, typescriptPlugin],
});

const main = async () => {
	const items = await instance.getItems();

	console.log(JSON.stringify(items, null, 2), items.length);
};

void main();
