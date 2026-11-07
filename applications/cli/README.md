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
- Groups usages by name, with counts and nested source locations.
- Writes a contextual usage report and formatted JSON to standard output. Errors go to standard error.

<br>

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

In a terminal, raw JSON starts collapsed. Type `r` and press Enter to expand or collapse it;
type `s` and press Enter to save the raw JSON to `sdk-usage.json` in the scanned directory,
or type `q` and press Enter to quit. Saving replaces the file if it already exists.
When you redirect input or output, you get the full report and JSON without a prompt.

The command scans the current working directory. It excludes `.git`, `node_modules`, `dist`,
`out`, test-like files, and story-like files by default. The current CLI does not accept command
line options; use `@sdk-usage/core` directly to configure file filters, module filters, or plugins.

<br>

## 🏗️ Architecture

The CLI wires `@sdk-usage/core` with the JSX, JavaScript, and TypeScript plugins, consumes the
resulting async iterable, and formats the usages and JSON into one report on standard output. See
the [core documentation](../../libraries/core/README.md) to customize scanning.

<br>

## ✍️ Contribution

See the repository [contribution guide](../../CONTRIBUTING.md).

<br>

## 📖 License

[MIT](../../LICENSE)
