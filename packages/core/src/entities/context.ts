import { Package } from "./package";

export type Context = {
	/** The root path of the analyzed project */
	root: string;
	pkg: Package;
};
