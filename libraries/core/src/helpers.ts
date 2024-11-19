import { join } from "node:path";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";

export const require = createRequire(import.meta.url);

export const resolvePackageJson = (fromPath: string): string => {
	const filepath = join(fromPath, "./package.json");

	if (existsSync(filepath)) {
		return filepath;
	}

	return resolvePackageJson(join(fromPath, "../"));
};

/**
 * Execute an external command.
 * @param command - The command to execute.
 * @param options - Options including current working directory configuration.
 * @param options.cwd - Configure the current working directory.
 * @returns The output (either the command output or error).
 * @example
 * exec("ls");
 */
export const exec = async (command: string, options: { cwd?: string } = {}) => {
	return new Promise<string>((resolve, reject) => {
		let stdout = "";
		let stderr = "";

		const [bin, ...arguments_] = command.split(" ") as [
			string,
			...string[],
		];

		// eslint-disable-next-line sonarjs/os-command
		const childProcess = spawn(bin, arguments_, {
			cwd: options.cwd,
			shell: true,
			stdio: "pipe",
		});

		childProcess.stdout.on("data", (chunk: string) => {
			stdout += chunk;
		});

		childProcess.stderr.on("data", (chunk: string) => {
			stderr += chunk;
		});

		childProcess.on("close", (exitCode) => {
			if (exitCode !== 0) {
				const output = `${stderr}${stdout}`;

				reject(new Error(output.trim()));
			} else {
				resolve(stdout.trim());
			}
		});
	});
};
