import { parse } from "@esonar/core";

import { EXAMPLE_SOLID } from "./constants";

const main = async () => {
	// @todo: make output file configurable
	const output = await parse(EXAMPLE_SOLID, {
		root: process.cwd(),
		file: "./test.tsx",
		pkg: {
			name: "@example/solid",
			version: "0.1.0",
			dependencies: new Map([
				["@suid/material", "1.0.0"],
				["solid-js", "2.0.0"],
			]),
		},
	});

	console.log(JSON.stringify(output, null, 2));
};

main().catch((error) => {
	console.log("Error", error);
});
