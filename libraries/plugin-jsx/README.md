<br>
<div align="center">
    <h1>@sdk-usage/plugin-jsx</h1>
    <strong>Parser plugin for collecting imported JSX component usage.</strong>
</div>
<br>
<br>

## ✨ Features

- Collects JSX opening elements whose root tag identifier is imported by the source file.
- Supports default, named, namespace, member-expression, and namespaced component names.
- Captures literal attribute values and records whether attributes use spreading.
- Represents dynamic expressions with a typed `unsupported-syntax` token.

Named and default imports use their imported component name. Member expressions such as
`<UI.Button />` and namespaced names such as `<UI:Button />` use the final member name.
Namespaced attributes such as `xlink:href` are recorded with their colon-separated name.
Attributes without a value become `true`; null values become `undefined`.

Fragments, unimported tags, spread contents, and dynamic expression values are not collected.

## 🚀 Usage

Install the core package and the plugin:

```sh
pnpm add @sdk-usage/core @sdk-usage/plugin-jsx
```

```ts
import { createAnalyzer } from "@sdk-usage/core";
import { plugin } from "@sdk-usage/plugin-jsx";

const analyzer = createAnalyzer(process.cwd(), { plugins: [plugin] });

for await (const item of analyzer.getItems()) {
	console.log(item);
}
```

## 🏗️ Architecture

The plugin registers a visitor for `JSXOpeningElement` nodes with core and emits `jsx/element` items for
recognized imported components. Core resolves each item to its source location and package
metadata. See [core](../core/README.md) for scanning options.

## ✍️ Contribution

See the repository [contribution guide](../../CONTRIBUTING.md).

## 📖 License

[MIT](../../LICENSE)
