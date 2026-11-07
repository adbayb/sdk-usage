<br>
<div align="center">
    <h1>@examples/chakra-ui</h1>
    <strong>Private example package demonstrating SDK usage collection with Chakra UI.</strong>
</div>
<br>
<br>

## ✨ Features

- `chakra-ui` demonstrates JSX, JavaScript runtime, and TypeScript type collection.
- The fixture includes imported Chakra components and props, React hook usage, and imported value references.

<br>

## 🚀 Usage

From the repository root, run the Chakra UI example:

```sh
pnpm --filter @examples/chakra-ui start
```

The command runs the workspace CLI from the example package directory. It prints collected usage
items as JSON and writes the item count to standard error.

<br>

## 🏗️ Architecture

Examples are private workspace packages under `examples/`. They depend on the CLI through
`workspace:*`, so running an example exercises the current source packages rather than a published
release. See [`chakra-ui/src/button.tsx`](chakra-ui/src/button.tsx) for the fixture.

<br>

## ✍️ Contribution

See the repository [contribution guide](../CONTRIBUTING.md).

<br>

## 📖 License

[MIT](../LICENSE)
