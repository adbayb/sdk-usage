import { describe, expect, test } from "vitest";
import { createLocation } from "./create-location";

describe(createLocation, () => {
	test("calculates the column correctly after a multibyte character", () => {
		const code = 'const face = "😀";\n<Button />';
		const offset = Buffer.byteLength(code.slice(0, code.indexOf("<Button")));

		const location = createLocation({
			code,
			file: "/project/src/file.tsx",
			link: "",
			module: "project",
			offset,
			path: "/project",
		});

		expect(location).toMatchObject({ column: 0, line: 2 });
	});
});
