import { esusage } from "@esusage/core";
import jsxSyntaxPlugin from "@esusage/plugin-syntax-jsx";
import typescriptSyntaxPlugin from "@esusage/plugin-syntax-typescript";

const main = async () => {
	const items = await esusage(process.cwd(), {
		plugins: { syntax: [jsxSyntaxPlugin, typescriptSyntaxPlugin] },
	});

	console.log(JSON.stringify(items, null, 2), items.length);
};

main().catch((error) => {
	console.log("Error", error);
});
