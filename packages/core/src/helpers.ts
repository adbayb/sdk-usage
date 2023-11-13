import { spawn } from "child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Resolve a relative path from the node module directory
 * @param path The relative path
 * @returns The resolved absolute path
 */
export const resolveFromPackageDirectory = (path: string) => {
	return resolve(__dirname, "../", path);
};

/**
 * Resolve a relative path from the current working directory
 * @param path The relative path
 * @returns The resolved absolute path
 */
export const resolveFromWorkingDirectory = (path: string) => {
	return resolve(process.cwd(), path);
};

/**
 * Execute an external command
 * @param command The command to execute
 * @param options Options including current working directory configuration
 * @returns The output (either the command output or error)
 */
export const exec = async (command: string, options: { cwd?: string } = {}) => {
	return new Promise<string>((success, error) => {
		let stdout = "";
		let stderr = "";
		const [bin, ...args] = command.split(" ") as [string, ...string[]];

		const childProcess = spawn(bin, args, {
			cwd: options.cwd,
			shell: true,
			stdio: "pipe",
		});

		childProcess.stdout.on("data", (chunk) => {
			stdout += chunk;
		});

		childProcess.stderr.on("data", (chunk) => {
			stderr += chunk;
		});

		childProcess.on("close", (exitCode) => {
			if (exitCode !== 0) {
				const output = `${stderr}${stdout}`;

				error(output.trim());
			} else {
				success(stdout.trim());
			}
		});
	});
};
