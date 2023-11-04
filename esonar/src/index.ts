import type { Item } from "@esonar/core";
import { parse, scan } from "@esonar/core";
import { readFileSync } from "fs";

const main = async () => {
	const projects = scan();
	const items: Item[] = [];

	for (const project of projects) {
		for (const file of project.files) {
			const content = readFileSync(file, "utf-8");
			const module = project.metadata.name;

			// console.log(
			// 	file,
			// 	await parse(content, {
			// 		file,
			// 		module,
			// 	}),
			// );

			items.push(
				...(await parse(content, {
					file,
					module,
				})),
			);
		}
	}

	console.log(items);
};

main().catch((error) => {
	console.log("Error", error);
});
