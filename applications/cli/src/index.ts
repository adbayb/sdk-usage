import { esusage } from "@esusage/core";
import jsxElementPlugin from "@esusage/plugin-jsx-element";
import typePlugin from "@esusage/plugin-type";

const main = async () => {
	const items = await esusage(process.cwd(), {
		plugins: [jsxElementPlugin, typePlugin],
	});

	console.log(JSON.stringify(items, null, 2), items.length);
};

main().catch((error) => {
	console.log("Error", error);
});
