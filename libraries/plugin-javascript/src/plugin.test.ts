import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInstance } from "@sdk-usage/core";
import { describe, expect, test } from "vitest";
import { plugin } from "./plugin";

describe(plugin, () => {
	test("should collect imported calls, constructors, templates, and value references", async () => {
		const directory = await mkdtemp(join(tmpdir(), "sdk-usage-javascript-test-"));

		try {
			await mkdir(join(directory, "src"), { recursive: true });

			await writeFile(
				join(directory, "package.json"),
				JSON.stringify({ name: "fixture", version: "1.0.0" }),
			);

			await writeFile(
				join(directory, "src", "index.js"),
				[
					'import { run as sdkRun, Client, SDK_VERSION, template } from "sdk";',
					'import * as SDK from "sdk";',
					'import type { TypeOnly } from "sdk";',
					'import { type InlineType, action } from "sdk";',
					"sdkRun();",
					'SDK["start"]();',
					"SDK[method]();",
					"SDK.client.connect();",
					"SDK?.client?.connect?.();",
					"new Client();",
					"new SDK.Client();",
					"template`hello`;",
					"const { action: aliasedAction, create } = SDK;",
					"aliasedAction();",
					"create();",
					"const SDKAlias = SDK;",
					"SDKAlias.open();",
					"const version = SDK_VERSION;",
					"consume(sdkRun);",
					"<Component value={SDK_VERSION} callback={sdkRun} result={SDK.run()} />;",
					"const sdk = SDK.client;",
					"const connect = SDK.client.connect;",
					"const namespace = SDK;",
					"function callback(sdkRun) { sdkRun(); }",
					"{ const sdkRun = () => {}; sdkRun(); }",
					"TypeOnly();",
					"InlineType();",
					"action;",
					"function local() {}",
					"local();",
				].join("\n"),
			);

			const items = await Array.fromAsync(
				createInstance(directory, { plugins: [plugin] }).getItems(),
			);

			expect(
				items.map(({ name, module, type }) => {
					return { name, module, type };
				}),
			).toStrictEqual([
				{ name: "run", module: "sdk", type: "javascript/call" },
				{ name: "start", module: "sdk", type: "javascript/call" },
				{ name: "connect", module: "sdk", type: "javascript/call" },
				{ name: "connect", module: "sdk", type: "javascript/call" },
				{ name: "Client", module: "sdk", type: "javascript/constructor" },
				{ name: "Client", module: "sdk", type: "javascript/constructor" },
				{ name: "template", module: "sdk", type: "javascript/call" },
				{ name: "SDK", module: "sdk", type: "javascript/reference" },
				{ name: "action", module: "sdk", type: "javascript/call" },
				{ name: "create", module: "sdk", type: "javascript/call" },
				{ name: "SDK", module: "sdk", type: "javascript/reference" },
				{ name: "open", module: "sdk", type: "javascript/call" },
				{ name: "SDK_VERSION", module: "sdk", type: "javascript/reference" },
				{ name: "run", module: "sdk", type: "javascript/reference" },
				{ name: "SDK_VERSION", module: "sdk", type: "javascript/reference" },
				{ name: "run", module: "sdk", type: "javascript/reference" },
				{ name: "run", module: "sdk", type: "javascript/call" },
				{ name: "client", module: "sdk", type: "javascript/reference" },
				{ name: "connect", module: "sdk", type: "javascript/reference" },
				{ name: "SDK", module: "sdk", type: "javascript/reference" },
				{ name: "action", module: "sdk", type: "javascript/reference" },
			]);
		} finally {
			await rm(directory, { force: true, recursive: true });
		}
	});
});
