import config from "@adbayb/stack/eslint";

export default [
	...config,
	{
		files: ["libraries/plugin-*/**"],
		rules: {
			"import-x/no-default-export": "off",
			"sonarjs/function-name": "off",
		},
	},
];
