import type { Item } from "@esonar/core";
import { EOL } from "node:os";

export const createManyDocuments = async (items: Item[]) => {
	const endpoint = new URL("_bulk", BASE_URL);

	const body = items.reduce(
		(output, item) =>
			`${output}${appendLine(
				JSON.stringify({
					index: { _index: "gemini" },
				}),
			)}${appendLine(JSON.stringify(item))}`,
		"",
	);

	try {
		const response = await fetch(endpoint.href, {
			body,
			headers: {
				"Content-Type": "application/x-ndjson",
			},
			method: "POST",
		});

		const data = (await response.json()) as Record<string, string>;

		if (!response.ok) {
			throw new Error(
				`An error occured while requesting ${
					endpoint.href
				}\n${JSON.stringify(
					{
						code: response.status,
						details: data,
						message: response.statusText,
					},
					null,
					2,
				)}`,
			);
		}

		return data;
	} catch (error) {
		console.error(error);

		return null;
	}
};

const BASE_URL = "http://localhost:9200/";
const appendLine = (text: string) => `${text}${EOL}`;
