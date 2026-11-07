import { writeFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const inputTTY = Object.getOwnPropertyDescriptor(process.stdin, "isTTY");
const outputTTY = Object.getOwnPropertyDescriptor(process.stdout, "isTTY");
const { exitCode } = process;

vi.mock(import("node:fs/promises"), async (importOriginal) => {
	const original = await importOriginal();

	return { ...original, writeFile: vi.fn() };
});

const fixture = vi.hoisted(() => {
	return {
		close: vi.fn(),
		commands: [] as string[],
		isInputTTY: true,
		isOutputTTY: true,
		items: [
			{
				name: "Button",
				location: { column: 3, file: "./src/first.tsx", line: 10 },
				module: "ui",
				type: "jsx",
				version: "^1.0.0",
			},
			{
				name: "Link",
				location: { column: 5, file: "./src/first.tsx", line: 12 },
				module: "ui",
				type: "jsx",
				version: "^1.0.0",
			},
			{
				name: "Button",
				location: { column: 7, file: "./src/second.ts", line: 20 },
				module: "other-ui",
				type: "call",
				version: "",
			},
		].map((item) => {
			return {
				name: item.name,
				createdAt: "2026-01-01T00:00:00.000Z",
				input: { metadata: { withSpreading: false }, data: {} },
				location: {
					column: item.location.column,
					file: item.location.file,
					line: item.location.line,
					link: "",
					module: "fixture",
				},
				module: item.module,
				type: item.type,
				version: item.version,
			};
		}),
		setPrompt: vi.fn<(prompt: string) => void>(),
	};
});

vi.mock(import("@sdk-usage/core"), async (importOriginal) => {
	const original = await importOriginal();

	return {
		...original,
		createInstance: () => {
			return {
				async *getItems() {
					for (const item of fixture.items) {
						yield await Promise.resolve(item);
					}
				},
			};
		},
	};
});

vi.mock(import("node:process"), async (importOriginal) => {
	const original = await importOriginal();

	return {
		...original,
		cwd: () => {
			return "/projects/fixture";
		},
	};
});

vi.mock(import("node:util"), async (importOriginal) => {
	const original = await importOriginal();

	return {
		...original,
		styleText: (_format: unknown, text: string) => {
			return text;
		},
	};
});

vi.mock(import("node:readline"), async (importOriginal) => {
	const original = await importOriginal();
	const { PassThrough } = await import("node:stream");

	return {
		...original,
		clearScreenDown: vi.fn(),
		createInterface: vi.fn(() => {
			const input = new PassThrough();
			const terminal = original.createInterface({ input, terminal: false });
			const close = terminal.close.bind(terminal);

			vi.spyOn(terminal, "close").mockImplementation(() => {
				fixture.close();
				close();
			});

			vi.spyOn(terminal, "setPrompt").mockImplementation(fixture.setPrompt);

			vi.spyOn(terminal, "prompt").mockImplementation(() => {
				/* Empty */
			});

			queueMicrotask(() => {
				input.end(fixture.commands.length > 0 ? `${fixture.commands.join("\n")}\n` : "");
			});

			return terminal;
		}),
		cursorTo: vi.fn(),
	};
});

describe("report", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		vi.mocked(writeFile).mockResolvedValue();
		fixture.commands = ["q"];
		fixture.isInputTTY = true;
		fixture.isOutputTTY = true;

		Object.defineProperty(process.stdin, "isTTY", {
			configurable: true,
			get: () => {
				return fixture.isInputTTY;
			},
		});

		Object.defineProperty(process.stdout, "isTTY", {
			configurable: true,
			get: () => {
				return fixture.isOutputTTY;
			},
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
		process.exitCode = exitCode;

		if (inputTTY) {
			Object.defineProperty(process.stdin, "isTTY", inputTTY);
		} else {
			Reflect.deleteProperty(process.stdin, "isTTY");
		}

		if (outputTTY) {
			Object.defineProperty(process.stdout, "isTTY", outputTTY);
		} else {
			Reflect.deleteProperty(process.stdout, "isTTY");
		}
	});

	test("should group names with counts and preserve each location's package and type", async () => {
		const log = vi.spyOn(console, "log").mockImplementation(() => {
			/* Empty */
		});

		await import("./index");

		await vi.waitFor(() => {
			expect(fixture.close).toHaveBeenCalledWith();
		});

		expect(log).toHaveBeenCalledExactlyOnceWith(
			[
				"SDK Usage Report",
				"",
				"Found 3 usages across 2 packages in 2 files",
				"Project: fixture",
				"Root: /projects/fixture",
				"",
				"Button (2 usages)",
				"  ./src/first.tsx:10:3",
				"    ui@^1.0.0 jsx",
				"  ./src/second.ts:20:7",
				"    other-ui call",
				"",
				"Link (1 usage)",
				"  ./src/first.tsx:12:5",
				"    ui@^1.0.0 jsx",
				"",
			].join("\n"),
		);

		expect(fixture.setPrompt).toHaveBeenCalledWith(
			expect.stringContaining("[+] Raw output (JSON)"),
		);
	});

	test("should expand and collapse raw JSON", async () => {
		const log = vi.spyOn(console, "log").mockImplementation(() => {
			/* Empty */
		});

		fixture.commands = ["r", "r", "q"];
		await import("./index");

		await vi.waitFor(() => {
			expect(fixture.close).toHaveBeenCalledWith();
		});

		expect(
			fixture.setPrompt.mock.calls.map(([prompt]) => {
				return prompt;
			}),
		).toStrictEqual([
			expect.stringContaining("[+] Raw output (JSON)"),
			expect.stringContaining("[-] Raw output (JSON)"),
			expect.stringContaining("[+] Raw output (JSON)"),
		]);

		expect(
			log.mock.calls.filter(([output]) => {
				return output === JSON.stringify(fixture.items, undefined, 2);
			}),
		).toHaveLength(1);

		expect(log.mock.calls.at(-1)?.[0]).not.toContain('"name"');
	});

	test("should save the complete raw JSON without expanding it", async () => {
		const log = vi.spyOn(console, "log").mockImplementation(() => {
			/* Empty */
		});

		fixture.commands = ["s", "q"];
		await import("./index");

		await vi.waitFor(() => {
			expect(fixture.close).toHaveBeenCalledWith();
		});

		expect(writeFile).toHaveBeenCalledExactlyOnceWith(
			"/projects/fixture/sdk-usage.json",
			`${JSON.stringify(fixture.items, undefined, 2)}\n`,
			{ encoding: "utf8", flag: "w" },
		);

		expect(log).toHaveBeenCalledWith("Saved JSON report to /projects/fixture/sdk-usage.json");

		expect(
			log.mock.calls.some(([output]) => {
				return output === "Raw output (JSON)";
			}),
		).toBe(false);
	});

	test("should report save failures and close the terminal without claiming success", async () => {
		const error = new Error("Permission denied");

		const log = vi.spyOn(console, "log").mockImplementation(() => {
			/* Empty */
		});

		const errorLog = vi.spyOn(console, "error").mockImplementation(() => {
			/* Empty */
		});

		vi.mocked(writeFile).mockRejectedValueOnce(error);
		fixture.commands = ["s"];
		await import("./index");

		await vi.waitFor(() => {
			expect(errorLog).toHaveBeenCalledWith(error);
		});

		expect(fixture.close).toHaveBeenCalledWith();
		expect(process.exitCode).toBe(1);

		expect(
			log.mock.calls.some(([output]) => {
				return String(output).startsWith("Saved JSON");
			}),
		).toBe(false);
	});

	test.each([
		{ isInputTTY: false, isOutputTTY: true },
		{ isInputTTY: true, isOutputTTY: false },
	])(
		"should keep raw JSON without prompts when either stream is redirected: %j",
		async (streams) => {
			const log = vi.spyOn(console, "log").mockImplementation(() => {
				/* Empty */
			});

			Object.assign(fixture, streams);
			await import("./index");

			await vi.waitFor(() => {
				expect(log).toHaveBeenCalledWith(JSON.stringify(fixture.items, undefined, 2));
			});

			expect(createInterface).not.toHaveBeenCalled();
			expect(writeFile).not.toHaveBeenCalled();
		},
	);

	test("should render an empty report and close on end of input", async () => {
		const log = vi.spyOn(console, "log").mockImplementation(() => {
			/* Empty */
		});

		const { items } = fixture;

		fixture.items = [];
		fixture.commands = [];

		try {
			await import("./index");

			await vi.waitFor(() => {
				expect(fixture.close).toHaveBeenCalledWith();
			});

			expect(log).toHaveBeenCalledExactlyOnceWith(
				"SDK Usage Report\n\nNo SDK usage found in fixture\nRoot: /projects/fixture",
			);
		} finally {
			fixture.items = items;
		}
	});
});
