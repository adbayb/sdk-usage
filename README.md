<br>
<div align="center">
    <h1>sdk-usage</h1>
    <strong>A code analyzer that collects usage of SDK-like components from JSX, JavaScript, and TypeScript source.</strong>
</div>
<br>
<br>

## ✨ Features

- Collect imported JSX components and their statically known attributes.
- Collect imported JavaScript runtime calls, constructors, tagged templates, and value references.
- Collect imported TypeScript type references, including qualified and inline import types.
- Report source locations, package names, and dependency versions for each usage.
- Extend syntax collection with plugins.

<br>

## 🚀 Usage

Run the CLI from the project directory you want to scan:

```sh
pnpm dlx @sdk-usage/cli
```

The CLI scans JavaScript, JSX, TypeScript, and TSX files, then writes a JSON array to standard
output. A count of collected usages is written to standard error. By default, test-like files,
story-like files, `node_modules`, `.git`, `dist`, and `out` are excluded.

To use the analyzer from code:

```sh
pnpm add @sdk-usage/core @sdk-usage/plugin-jsx @sdk-usage/plugin-javascript @sdk-usage/plugin-typescript
```

```ts
import { createAnalyzer } from "@sdk-usage/core";
import { plugin as javascript } from "@sdk-usage/plugin-javascript";
import { plugin as jsx } from "@sdk-usage/plugin-jsx";
import { plugin as typescript } from "@sdk-usage/plugin-typescript";

const analyzer = createAnalyzer(process.cwd(), {
	plugins: [jsx, javascript, typescript],
});

for await (const item of analyzer.getItems()) {
	console.log(item);
}
```

See the [CLI](applications/cli/README.md), [core](libraries/core/README.md), and plugin
documentation for details.

<br>

## 🏗️ Architecture

The workspace is split into packages:

- [`@sdk-usage/cli`](applications/cli/README.md) provides the command-line interface.
- [`@sdk-usage/core`](libraries/core/README.md) scans packages, parses source, and creates usage
  records.
- [`@sdk-usage/plugin-jsx`](libraries/plugin-jsx/README.md) collects JSX component usage.
- [`@sdk-usage/plugin-javascript`](libraries/plugin-javascript/README.md) collects imported
  JavaScript runtime usage.
- [`@sdk-usage/plugin-typescript`](libraries/plugin-typescript/README.md) collects imported
  TypeScript type usage.
- [`examples`](examples/README.md) contains a Chakra UI fixture for exercising the CLI.

The core owns traversal and item metadata; plugins define which syntax nodes become usage records.

<br>

## ✍️ Contribution

We're open to new contributions. See the [contribution guide](CONTRIBUTING.md) for details.

<br>

## 📖 License

[MIT](LICENSE)
