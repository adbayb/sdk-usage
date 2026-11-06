<br>
<div align="center">
    <h1>@sdk-usage/cli</h1>
    <strong>Command-line interface for scanning projects and collecting SDK usage as JSON.</strong>
</div>
<br>
<br>

## ✨ Features

- Runs the JSX, JavaScript, and TypeScript collection plugins.
- Scans JavaScript, JSX, TypeScript, and TSX source files under the current directory.
- Reports source locations, package names, and dependency versions.
- Writes a contextual usage report and formatted JSON to standard output. Errors go to standard error.

## 🚀 Usage

Requires Node.js 22.5 or newer because `@sdk-usage/core` uses `node:path.matchesGlob`.

Run without installing:

```sh
pnpm dlx @sdk-usage/cli
```

Or install it in a project:

```sh
pnpm add -D @sdk-usage/cli
pnpm exec sdk-usage
```

The command scans the current working directory. It excludes `.git`, `node_modules`, `dist`,
`out`, test-like files, and story-like files by default. The current CLI does not accept command
line options; use `@sdk-usage/core` directly to configure file filters, module filters, or plugins.

## 🏗️ Architecture

The CLI wires `@sdk-usage/core` with the JSX, JavaScript, and TypeScript plugins, consumes the
resulting async iterable, and formats the usages and JSON into one report on standard output. See
the [core documentation](../../libraries/core/README.md) to customize scanning.

## ✍️ Contribution

See the repository [contribution guide](../../CONTRIBUTING.md).

## 📖 License

[MIT](../../LICENSE)
