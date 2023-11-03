import { parse, scan } from "@esonar/core";

const main = async () => {
	// @todo: make output file configurable
	await parse("console.log('hello')", {
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

	console.log(scan());
};

main().catch((error) => {
	console.log("Error", error);
});
