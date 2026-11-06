# @sdk-usage/plugin-typescript

## 0.2.0

### Minor Changes

- [`e7d80cf`](https://github.com/adbayb/sdk-usage/commit/e7d80cfb8c93dda0ef6b3da8caad8deffa8a378c) Thanks [@adbayb](https://github.com/adbayb)! - Replace the default exports from the JSX and TypeScript plugins with a named `plugin` export. This is a breaking change for consumers of either plugin. Update the CLI to use the named exports and fix parser/type-check issues.

- [`193e885`](https://github.com/adbayb/sdk-usage/commit/193e88563f19047d98e8fd9f882ad7d375181d51) Thanks [@adbayb](https://github.com/adbayb)! - Dispatch plugins by SWC node type, enabling TypeScript collection in the parser. Collect imported
  TypeScript references (including qualified/inline types, interface heritage, and `typeof` queries),
  JSX member-expression components, and namespaced JSX tags and attributes. Represent unsupported
  JSX expressions with typed tokens, pass plugin helpers through one input object, and enable the
  JavaScript plugin in the CLI.

### Patch Changes

- [`0093cac`](https://github.com/adbayb/sdk-usage/commit/0093caca2693b185fa90274c62a5aa88e644e97d) Thanks [@adbayb](https://github.com/adbayb)! - Update dependencies including SWC.

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
