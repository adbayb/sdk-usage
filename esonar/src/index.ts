import { esonar } from "@esonar/core";

import { createManyDocuments } from "./elastic";

const main = async () => {
	const items = await esonar({
		includeModules: [
			"@gemini/core",
			"@gemini/icons",
			"@gemini/logos",
			"@gemini/server",
			"@gemini/tokens",
			"@gemini/ui",
		],
	});

	await createManyDocuments(items);

	console.log(JSON.stringify(items, null, 2), items.length);
};

main().catch((error) => {
	console.log("Error", error);
});
