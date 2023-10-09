import { resolve } from "node:path";

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
