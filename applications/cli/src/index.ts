import { analyze } from "@esusage/core";

const main = async () => {
	const items = await analyze(process.cwd());

	console.log(JSON.stringify(items, null, 2), items.length);
};

main().catch((error) => {
	console.log("Error", error);
});
