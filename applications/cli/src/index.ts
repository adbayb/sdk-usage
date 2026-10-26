import { cwd } from "node:process";
import { createInstance } from "@sdk-usage/core";
import { plugin as jsxPlugin } from "@sdk-usage/plugin-jsx";
import { plugin as typescriptPlugin } from "@sdk-usage/plugin-typescript";

const main = async () => {
	const instance = createInstance(cwd(), {
		plugins: [jsxPlugin, typescriptPlugin],
	});

	const output = [];

	for await (const item of instance.getItems()) {
		output.push(item);
	}

	console.log(JSON.stringify(output, undefined, 2));
	console.error(`${output.length} items`);
};

const run = async () => {
	try {
		await main();
	} catch (error) {
		console.error(error);
		process.exitCode = 1;
	}
};

/*
 * Top-level await is not supported by the package's CommonJS build.
 */
// oxlint-disable-next-line unicorn/prefer-top-level-await
void run();
