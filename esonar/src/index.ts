import { esonar } from "@esonar/core";

const main = async () => {
	await esonar();
};

main().catch((error) => {
	console.log("Error", error);
});
