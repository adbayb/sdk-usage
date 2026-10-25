import { cwd } from "node:process";
import { createInstance } from "@sdk-usage/core";
import { plugin as jsxPlugin } from "@sdk-usage/plugin-jsx";
import { plugin as typescriptPlugin } from "@sdk-usage/plugin-typescript";

const main = async () => {
	const instance = createInstance(cwd(), {
		plugins: [jsxPlugin, typescriptPlugin],
	});

	const items = await instance.getItems();

	console.log(JSON.stringify(items, undefined, 2), items.length);
};

/*
 * Top-level await is not supported by the package's CommonJS build.
 */
// oxlint-disable-next-line unicorn/prefer-top-level-await
void main();
