import { describe, expect, test } from "vitest";
import { createLocator } from "./create-locator";

describe(createLocator, () => {
	test("locates byte offsets after multibyte characters, in any lookup order", () => {
		const code = 'const face = "😀";\n<Button />\n\t<Link />';

		const locate = createLocator({
			code,
			file: "/project/src/file.tsx",
			link: "",
			module: "project",
			path: "/project",
		});

		const getPosition = (token: string) => {
			const prefix = code.slice(0, code.indexOf(token));
			const { column, line } = locate(Buffer.byteLength(prefix));

			return { column, line };
		};

		expect(getPosition("<Link")).toStrictEqual({ column: 1, line: 3 });
		expect(getPosition("<Button")).toStrictEqual({ column: 0, line: 2 });
		expect(getPosition('";')).toStrictEqual({ column: 16, line: 1 });

		expect(locate(0)).toStrictEqual({
			column: 0,
			file: "./src/file.tsx",
			line: 1,
			link: "",
			module: "project",
		});
	});
});
