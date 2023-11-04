import type { Item } from "@esonar/core";
import { parse, scan } from "@esonar/core";
import { readFileSync } from "fs";

const main = async () => {
	const projects = scan();
	const items: Item[] = [];

	for (const project of projects) {
		for (const file of project.files) {
			const content = readFileSync(file, "utf-8");

			items.push(
				...(await parse(content, {
					file,
				})),
			);
		}
	}

	console.log(items);
};

main().catch((error) => {
	console.log("Error", error);
});
