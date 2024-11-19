import process from "node:process";

import typescriptSyntaxPlugin from "@esusage/plugin-syntax-typescript";
import jsxSyntaxPlugin from "@esusage/plugin-syntax-jsx";
import { esusage } from "@esusage/core";

const main = async () => {
	const items = await esusage(process.cwd(), {
		plugins: { syntax: [jsxSyntaxPlugin, typescriptSyntaxPlugin] },
	});

	console.log(JSON.stringify(items, null, 2), items.length);
};

void main();
