import { fdir } from "fdir";
import { dirname } from "node:path";

import { CWD } from "../constants";

type ProjectFileStructure = {
	root: string;
	metadata: string;
	files: string[];
};

export const scan = () => {
	const projects = getProjects();

	const output: ProjectFileStructure[] = projects.map((project) => {
		return { ...project, files: getFiles(project.root) };
	});

	return output;
};

const getProjects = (): Pick<ProjectFileStructure, "metadata" | "root">[] => {
	return new fdir()
		.withBasePath()
		.glob("**/package.json")
		.crawl(CWD)
		.sync()
		.map((path) => {
			return { root: dirname(path), metadata: path };
		});
};

const getFiles = (projectPath: string) => {
	return new fdir()
		.withBasePath()
		.glob("**/*.?(m){j,t}s?(x)") // js|jsx|ts|tsx|cjs|mjs|cjsx|mjsx
		.crawl(projectPath)
		.sync();
};

console.log(scan());
