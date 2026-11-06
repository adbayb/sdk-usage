import { basename } from "node:path";
import { cwd } from "node:process";
import { styleText } from "node:util";
import { createInstance } from "@sdk-usage/core";
import { plugin as javascriptPlugin } from "@sdk-usage/plugin-javascript";
import { plugin as jsxPlugin } from "@sdk-usage/plugin-jsx";
import { plugin as typescriptPlugin } from "@sdk-usage/plugin-typescript";

type TextStyle = "bold" | "cyan" | "dim" | "green" | "magenta";

const style = (format: readonly TextStyle[] | TextStyle, text: string) => {
	return styleText(format, text, { stream: process.stdout });
};

const pluralize = (count: number, noun: string) => {
	return `${count} ${noun}${count === 1 ? "" : "s"}`;
};

const formatReport = (
	root: string,
	items: {
		name: string;
		location: { column: number; file: string; line: number };
		module: string;
		type: string;
		version: string;
	}[],
) => {
	const modules = new Set(
		items.map(({ module }) => {
			return module;
		}),
	);

	const files = new Set(
		items.map(({ location }) => {
			return location.file;
		}),
	);

	const summary = [
		`Found ${pluralize(items.length, "usage")}`,
		`across ${pluralize(modules.size, "package")}`,
		`in ${pluralize(files.size, "file")}`,
	].join(" ");

	const details =
		items.length === 0
			? [`No SDK usage found in ${basename(root)}`, style("dim", `Root: ${root}`)]
			: [
					style("green", summary),
					`Project: ${basename(root)}`,
					style("dim", `Root: ${root}`),
					"",
					...items.flatMap(({ name, location, module, type, version }) => {
						const packageName = version ? `${module}@${version}` : module;

						return [
							`${style("bold", name)} ${style("magenta", type)}`,
							`  ${packageName}`,
							`  ${location.file}:${location.line}:${location.column}`,
							"",
						];
					}),
				];

	return [
		style(["bold", "cyan"], "SDK Usage Report"),
		"",
		...details,
		style("bold", "Raw output (JSON)"),
		JSON.stringify(items, undefined, 2),
	].join("\n");
};

const main = async () => {
	try {
		const root = cwd();

		const instance = createInstance(root, {
			plugins: [jsxPlugin, javascriptPlugin, typescriptPlugin],
		});

		const output = [];

		for await (const item of instance.getItems()) {
			output.push(item);
		}

		console.log(formatReport(root, output));
	} catch (error) {
		console.error(error);
		process.exitCode = 1;
	}
};

/*
 * Top-level await is not supported by the package's CommonJS build.
 */
// oxlint-disable-next-line unicorn/prefer-top-level-await
void main();
