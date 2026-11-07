<br>
<div align="center">
    <h1>@sdk-usage/plugin-javascript</h1>
    <strong>Parser plugin for collecting imported JavaScript runtime usage.</strong>
</div>
<br>
<br>

## ✨ Features

- Reports imported function calls, constructor calls, tagged templates, and value references.
- Includes positional call and constructor arguments in `input.data` when statically representable.
- Collects imported values used in JSX attribute expressions.
- Follows namespace aliases and destructured members through variable declarations.
- Reports namespace member access, including optional chains, by the final statically known member name; string-literal computed properties are supported.

Type-only imports, TypeScript type references, JSX names, and shadowed imported bindings are
excluded. Dynamic computed member names, local declarations, and references not derived from
imports are not collected. Dynamic imports and CommonJS `require()` are not collected.

<br>

## 🚀 Usage

Install the core package and the plugin:

```sh
pnpm add @sdk-usage/core @sdk-usage/plugin-javascript
```

```ts
import { createAnalyzer } from "@sdk-usage/core";
import { plugin } from "@sdk-usage/plugin-javascript";

const analyzer = createAnalyzer(process.cwd(), { plugins: [plugin] });

for await (const item of analyzer.getItems()) {
	console.log(item);
}
```

<br>

## 🏗️ Architecture

The plugin registers JavaScript and TypeScript syntax visitors with core and emits
`javascript/call`, `javascript/constructor`, and `javascript/reference` items for imported runtime
values. Core resolves each item to its source location and package metadata. See [core](../core/README.md)
for scanning options.

<br>

## ✍️ Contribution

See the repository [contribution guide](../../CONTRIBUTING.md).

<br>

## 📖 License

[MIT](../../LICENSE)
