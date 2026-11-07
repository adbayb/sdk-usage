# @sdk-usage/cli

## 0.3.1

### Patch Changes

- Updated dependencies [[`bc03818`](https://github.com/adbayb/sdk-usage/commit/bc0381809c2c66f3bd1cc76d06d8e6dee79a8f46)]:
    - @sdk-usage/core@0.3.0

## 0.3.0

### Minor Changes

- [`4353813`](https://github.com/adbayb/sdk-usage/commit/43538135656300b4e364e44f94fd53cb76f13b7f) Thanks [@adbayb](https://github.com/adbayb)! - Group usages by name with counts and nested locations, make raw JSON collapsible in interactive terminals, and add an interactive command to save the JSON report.

### Patch Changes

- Updated dependencies [[`22504bb`](https://github.com/adbayb/sdk-usage/commit/22504bb82a0a90f06bfe523054c8a2439b168fcf)]:
    - @sdk-usage/plugin-javascript@0.2.0

## 0.2.0

### Minor Changes

- [`78f66b4`](https://github.com/adbayb/sdk-usage/commit/78f66b47b8bfb5468c0e07e310327b54edba12e3) Thanks [@adbayb](https://github.com/adbayb)! - Style the output to make it clearer and cleaner.

- [`b54ae59`](https://github.com/adbayb/sdk-usage/commit/b54ae5937267951fb382d6ea6b56f57bf48ecee2) Thanks [@adbayb](https://github.com/adbayb)! - Stream SDK usages with backpressure instead of buffering every result in memory, so consumers can process results as they arrive and slow consumers limit read-ahead. When consumed incrementally, memory no longer grows with the total number of results.

    - `@sdk-usage/core` (breaking): `getItems()` returns a lazy `AsyncIterable<Item>` instead of `Promise<Item[]>`. Iterate it with `for await`; breaking out of the loop or returning from the iterator cancels the remaining scan.
    - `@sdk-usage/core`: `excludeFolders` and `includeFiles` are now applied, files in nested workspace packages are reported once, and versions come from the nearest `package.json`.
    - `@sdk-usage/core`: `includeFiles` patterns follow `node:path.matchesGlob`, so dot-prefixed segments must be matched explicitly and a leading `!` does not negate. The `fdir` and `picomatch` dependencies are removed.
    - `@sdk-usage/core`: an invalid source file now fails with an error naming the file instead of being skipped silently. Named imports without an alias resolve, and location columns are no longer shifted by one character or skewed by multibyte characters.
    - `@sdk-usage/plugin-jsx`: `withSpreading` metadata now reports JSX spread attributes.
    - `@sdk-usage/cli`: prints the item count to stderr and exits with code 1 on failure.

### Patch Changes

- [`e7d80cf`](https://github.com/adbayb/sdk-usage/commit/e7d80cfb8c93dda0ef6b3da8caad8deffa8a378c) Thanks [@adbayb](https://github.com/adbayb)! - Replace the default exports from the JSX and TypeScript plugins with a named `plugin` export. This is a breaking change for consumers of either plugin. Update the CLI to use the named exports and fix parser/type-check issues.

- [`193e885`](https://github.com/adbayb/sdk-usage/commit/193e88563f19047d98e8fd9f882ad7d375181d51) Thanks [@adbayb](https://github.com/adbayb)! - Dispatch plugins by SWC node type, enabling TypeScript collection in the parser. Collect imported
  TypeScript references (including qualified/inline types, interface heritage, and `typeof` queries),
  JSX member-expression components, and namespaced JSX tags and attributes. Represent unsupported
  JSX expressions with typed tokens, pass plugin helpers through one input object, and enable the
  JavaScript plugin in the CLI.

- [`0093cac`](https://github.com/adbayb/sdk-usage/commit/0093caca2693b185fa90274c62a5aa88e644e97d) Thanks [@adbayb](https://github.com/adbayb)! - Update dependencies including SWC.
- Updated dependencies [[`e7d80cf`](https://github.com/adbayb/sdk-usage/commit/e7d80cfb8c93dda0ef6b3da8caad8deffa8a378c), [`193e885`](https://github.com/adbayb/sdk-usage/commit/193e88563f19047d98e8fd9f882ad7d375181d51), [`0093cac`](https://github.com/adbayb/sdk-usage/commit/0093caca2693b185fa90274c62a5aa88e644e97d), [`b54ae59`](https://github.com/adbayb/sdk-usage/commit/b54ae5937267951fb382d6ea6b56f57bf48ecee2), [`193e885`](https://github.com/adbayb/sdk-usage/commit/193e88563f19047d98e8fd9f882ad7d375181d51)]:
    - @sdk-usage/core@0.2.0
    - @sdk-usage/plugin-jsx@0.2.0
    - @sdk-usage/plugin-typescript@0.2.0
    - @sdk-usage/plugin-javascript@0.1.0

## 0.1.0

### Minor Changes

- [`be2a154`](https://github.com/adbayb/sdk-usage/commit/be2a154ca18ea95640da6b7a09c428d5d76efed3) Thanks [@adbayb](https://github.com/adbayb)! - This release refines and simplifies the interfaces (considered as breaking changes but listed as minor prior to the stable major release).
  The following modifications have been introduced:
    - `@sdk-usage/core`: `createContext` has been renamed to `createInstance`.
    - `@sdk-usage/core`: `createSyntaxPlugin` has been renamed to `createPlugin`.
    - `@sdk-usage/core`: `plugins` accepts now directly an array of plugins.
    - `@sdk-usage/plugin-jsx`: `@sdk-usage/plugin-syntax-jsx` is deprecated (will be removed soon from the registry) and renamed to `@sdk-usage/plugin-jsx`.
    - `@sdk-usage/plugin-typescript`: `@sdk-usage/plugin-syntax-typescript` is deprecated (will be removed soon from the registry) and renamed to `@sdk-usage/plugin-typescript`.

- [`381a051`](https://github.com/adbayb/sdk-usage/commit/381a051dc38f4af080f4c9e4fa154ff2f6e02c2a) Thanks [@adbayb](https://github.com/adbayb)! - v0.1.0 release 🚀

### Patch Changes

- Updated dependencies [[`3c1e8df`](https://github.com/adbayb/sdk-usage/commit/3c1e8dfd5b54e20b7a8ddba91775363981772dfe), [`2e1fe4c`](https://github.com/adbayb/sdk-usage/commit/2e1fe4cc4c5e887ee60aa2618b267c6596ba8fb3), [`be2a154`](https://github.com/adbayb/sdk-usage/commit/be2a154ca18ea95640da6b7a09c428d5d76efed3), [`5eb26e3`](https://github.com/adbayb/sdk-usage/commit/5eb26e3bf67c247284e8e363af13d729fda88331), [`381a051`](https://github.com/adbayb/sdk-usage/commit/381a051dc38f4af080f4c9e4fa154ff2f6e02c2a)]:
    - @sdk-usage/core@0.1.0
    - @sdk-usage/plugin-jsx@0.1.0
    - @sdk-usage/plugin-typescript@0.1.0
