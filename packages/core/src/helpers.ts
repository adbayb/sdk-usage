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
