import { esonar } from "@esonar/core";

const main = async () => {
	const items = await esonar();

	console.log(JSON.stringify(items, null, 2), items.length);
};

main().catch((error) => {
	console.log("Error", error);
});
