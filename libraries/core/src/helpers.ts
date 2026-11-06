import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

export const require = createRequire(import.meta.url);

export const resolvePackageJson = (fromPath: string): string => {
	const filepath = join(fromPath, "./package.json");

	if (existsSync(filepath)) {
		return filepath;
	}

	return resolvePackageJson(join(fromPath, "../"));
};
