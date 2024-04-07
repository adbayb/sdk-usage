import { analyze } from "@esusage/core";
import { resolve } from "node:path";

const main = async () => {
	const items = await analyze(resolve("../../examples/chakra-ui"));

	console.log(JSON.stringify(items, null, 2), items.length);
};

main().catch((error) => {
	console.log("Error", error);
});
