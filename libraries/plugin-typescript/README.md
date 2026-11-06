<br>
<div align="center">
    <h1>@sdk-usage/plugin-typescript</h1>
    <strong>Parser plugin for collecting imported TypeScript type usage.</strong>
</div>
<br>
<br>

## ✨ Features

- Collects imported type aliases and qualified namespace types such as `UI.ButtonProps`.
- Supports inline import types such as `import("ui").ButtonProps`.
- Collects interface heritage, `implements` references, and `typeof` queries such as
  `typeof UI.Button`.
- Collects indexed-access types through their referenced base type, once per reference.

For qualified names, the collected name is the final type name. Inline import types require a
qualified type; an unqualified `import("ui")` does not identify a specific SDK usage. Local types,
primitive types, and type declarations by themselves are not collected.

## 🚀 Usage

Install the core package and the plugin:

```sh
pnpm add @sdk-usage/core @sdk-usage/plugin-typescript
```

```ts
import { createInstance } from "@sdk-usage/core";
import { plugin } from "@sdk-usage/plugin-typescript";

const analyzer = createInstance(process.cwd(), { plugins: [plugin] });

for await (const item of analyzer.getItems()) {
	console.log(item);
}
```

## 🏗️ Architecture

The plugin registers TypeScript syntax visitors with core and emits `typescript/type` items for
references to imported modules. Core resolves each item to its source location and package
metadata. See [core](../core/README.md) for scanning options.

## ✍️ Contribution

See the repository [contribution guide](../../CONTRIBUTING.md).

## 📖 License

[MIT](../../LICENSE)
