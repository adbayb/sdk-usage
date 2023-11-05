import { esonar } from "@esonar/core";

const main = async () => {
	const items = await esonar();

	console.log(items);
};

main().catch((error) => {
	console.log("Error", error);
});
