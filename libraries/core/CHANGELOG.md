# @sdk-usage/core

## 0.2.0

### Minor Changes

- [`f08690d`](https://github.com/adbayb/sdk-usage/commit/f08690da86e7b1d7b84c9b59d2ad273f39de4d33) Thanks [@adbayb](https://github.com/adbayb)! - Stream source scanning and SDK usage results with consumer backpressure, remove arbitrary scan-size caps, fix source parsing and locations, honor scan filters, avoid duplicate workspace results, and preserve JSX spread metadata.

- [`f08690d`](https://github.com/adbayb/sdk-usage/commit/f08690da86e7b1d7b84c9b59d2ad273f39de4d33) Thanks [@adbayb](https://github.com/adbayb)! - Change `getItems()` to return a backpressure-aware Node.js readable stream.

### Patch Changes

- [`e7d80cf`](https://github.com/adbayb/sdk-usage/commit/e7d80cfb8c93dda0ef6b3da8caad8deffa8a378c) Thanks [@adbayb](https://github.com/adbayb)! - Replace the default exports from the JSX and TypeScript plugins with a named `plugin` export. This is a breaking change for consumers of either plugin. Update the CLI to use the named exports and fix parser/type-check issues.

## 0.1.0

### Minor Changes

- [`be2a154`](https://github.com/adbayb/sdk-usage/commit/be2a154ca18ea95640da6b7a09c428d5d76efed3) Thanks [@adbayb](https://github.com/adbayb)! - This release refines and simplifies the interfaces (considered as breaking changes but listed as minor prior to the stable major release).
  The following modifications have been introduced:
    - `@sdk-usage/core`: `createContext` has been renamed to `createInstance`.
    - `@sdk-usage/core`: `createSyntaxPlugin` has been renamed to `createPlugin`.
    - `@sdk-usage/core`: `plugins` accepts now directly an array of plugins.
    - `@sdk-usage/plugin-jsx`: `@sdk-usage/plugin-syntax-jsx` is deprecated (will be removed soon from the registry) and renamed to `@sdk-usage/plugin-jsx`.
    - `@sdk-usage/plugin-typescript`: `@sdk-usage/plugin-syntax-typescript` is deprecated (will be removed soon from the registry) and renamed to `@sdk-usage/plugin-typescript`.

- [#4](https://github.com/adbayb/sdk-usage/pull/4) [`5eb26e3`](https://github.com/adbayb/sdk-usage/commit/5eb26e3bf67c247284e8e363af13d729fda88331) Thanks [@Eldraed](https://github.com/Eldraed)! - Add `resolveInstalledVersions` option with `false` as default. This option let the user choose between resolving installed version or the version from package.json.

- [`381a051`](https://github.com/adbayb/sdk-usage/commit/381a051dc38f4af080f4c9e4fa154ff2f6e02c2a) Thanks [@adbayb](https://github.com/adbayb)! - v0.1.0 release 🚀

### Patch Changes

- [`3c1e8df`](https://github.com/adbayb/sdk-usage/commit/3c1e8dfd5b54e20b7a8ddba91775363981772dfe) Thanks [@adbayb](https://github.com/adbayb)! - Update `@swc/core` to `1.15.33`.

- [#3](https://github.com/adbayb/sdk-usage/pull/3) [`2e1fe4c`](https://github.com/adbayb/sdk-usage/commit/2e1fe4cc4c5e887ee60aa2618b267c6596ba8fb3) Thanks [@Eldraed](https://github.com/Eldraed)! - Add `picomatch` as a dependency to allow standalone run of `sdk-usage`
