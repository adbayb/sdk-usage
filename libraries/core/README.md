<br>
<div align="center">
    <h1>@sdk-usage/core</h1>
    <strong>Core APIs for scanning package source and collecting SDK usage through syntax plugins.</strong>
</div>
<br>
<br>

## ✨ Features

- Discover package boundaries and JavaScript/TypeScript source files.
- Apply file and folder filters and optionally restrict results to selected modules.
- Run plugin visitors over parsed syntax and stream matching usage items.
- Report source file, line, column, repository link, package, and dependency version.

## 🚀 Usage

Install the core package and the plugins you want to run:

```sh
pnpm add @sdk-usage/core @sdk-usage/plugin-jsx @sdk-usage/plugin-javascript @sdk-usage/plugin-typescript
```

```ts
import { createAnalyzer } from "@sdk-usage/core";
import { plugin as javascript } from "@sdk-usage/plugin-javascript";
import { plugin as jsx } from "@sdk-usage/plugin-jsx";
import { plugin as typescript } from "@sdk-usage/plugin-typescript";

const analyzer = createAnalyzer(process.cwd(), {
	includeFiles: ["**/*.tsx"],
	includeModules: ["@chakra-ui/react"],
	plugins: [jsx, javascript, typescript],
});

for await (const item of analyzer.getItems()) {
	console.log(item);
}
```

`createAnalyzer(path, options)` accepts `includeFiles`, `excludeFolders`, `includeModules`,
`plugins`, and `resolveInstalledVersions`. File patterns follow Node.js `path.matchesGlob`
semantics. By default, the scanner excludes `.git`, `node_modules`, `dist`, and `out`, and ignores
test-like and story-like source files. `getItems()` returns an async iterable; stopping iteration
cancels pending scans.

## 🏗️ Architecture

Core owns package scanning, source parsing, plugin dispatch, and usage-item metadata. Plugins
receive one input object containing imported-binding metadata and parser helpers, and return
visitors keyed by SWC node type. See the [plugin documentation](../plugin-jsx/README.md) for a
built-in example.

## ✍️ Contribution

See the repository [contribution guide](../../CONTRIBUTING.md).

## 📖 License

[MIT](../../LICENSE)
