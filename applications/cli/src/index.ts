import { writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { cwd, stdin, stdout } from "node:process";
import { clearScreenDown, createInterface, cursorTo } from "node:readline";
import { styleText } from "node:util";
import { createAnalyzer } from "@sdk-usage/core";
import { plugin as javascriptPlugin } from "@sdk-usage/plugin-javascript";
import { plugin as jsxPlugin } from "@sdk-usage/plugin-jsx";
import { plugin as typescriptPlugin } from "@sdk-usage/plugin-typescript";

type ReportItem = {
	name: string;
	location: { column: number; file: string; line: number };
	module: string;
	type: string;
	version: string;
};

type TextStyle = "bold" | "cyan" | "dim" | "green" | "magenta";

const style = (format: readonly TextStyle[] | TextStyle, text: string) => {
	return styleText(format, text, { stream: stdout });
};

const pluralize = (count: number, noun: string) => {
	return `${count} ${noun}${count === 1 ? "" : "s"}`;
};

const formatReport = (root: string, items: ReportItem[]) => {
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
					...formatUsages(items),
				];

	return [style(["bold", "cyan"], "SDK Usage Report"), "", ...details].join("\n");
};

const formatUsages = (items: ReportItem[]) => {
	const lines: string[] = [];

	for (const [name, usages] of Map.groupBy(items, (item) => {
		return item.name;
	})) {
		lines.push(`${style("bold", name)} (${pluralize(usages.length, "usage")})`);

		for (const { location, module, type, version } of usages) {
			const packageName = version ? `${module}@${version}` : module;

			lines.push(
				`  ${location.file}:${location.line}:${location.column}`,
				`    ${packageName} ${style("magenta", type)}`,
			);
		}

		lines.push("");
	}

	return lines;
};

const printReport = async (root: string, report: string, items: ReportItem[]) => {
	console.log(report);

	if (!stdin.isTTY || !stdout.isTTY) {
		console.log(style("bold", "Raw output (JSON)"));
		console.log(JSON.stringify(items, undefined, 2));

		return;
	}

	const terminal = createInterface({ input: stdin, output: stdout });
	let isExpanded = false;

	const renderRawOutput = () => {
		if (isExpanded) {
			console.log(style("bold", "Raw output (JSON)"));
			console.log(JSON.stringify(items, undefined, 2));
		}

		terminal.setPrompt(
			`${isExpanded ? "[-]" : "[+]"} Raw output (JSON) | r + Enter: ${isExpanded ? "collapse" : "expand"} | s + Enter: save JSON | q + Enter: quit\n`,
		);

		terminal.prompt();
	};

	try {
		renderRawOutput();

		for await (const command of terminal) {
			if (command.trim().toLowerCase() === "q") {
				break;
			}

			if (command.trim().toLowerCase() === "s") {
				const file = join(root, "sdk-usage.json");

				await writeFile(file, `${JSON.stringify(items, undefined, 2)}\n`, {
					encoding: "utf8",
					flag: "w",
				});

				console.log(style("green", `Saved JSON report to ${file}`));
				terminal.prompt();

				continue;
			}

			if (command.trim().toLowerCase() === "r") {
				isExpanded = !isExpanded;
				cursorTo(stdout, 0, 0);
				clearScreenDown(stdout);
				console.log(report);
				renderRawOutput();
			} else {
				terminal.prompt();
			}
		}
	} finally {
		terminal.close();
	}
};

const main = async () => {
	try {
		const root = cwd();

		const analyzer = createAnalyzer(root, {
			plugins: [jsxPlugin, javascriptPlugin, typescriptPlugin],
		});

		const items = [];

		for await (const item of analyzer.getItems()) {
			items.push(item);
		}

		await printReport(root, formatReport(root, items), items);
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
