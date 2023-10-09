import { fdir } from "fdir";

import { CWD } from "../constants";

export const getProjects = () => {
	return new fdir()
		.withBasePath()
		.glob("**/*.package.json")
		.crawl(CWD)
		.sync();
};
