---
"@sdk-usage/cli": minor
"@sdk-usage/core": minor
"@sdk-usage/plugin-jsx": minor
"@sdk-usage/plugin-typescript": minor
---

This release refines and simplifies the interfaces (considered as breaking changes but listed as minor prior to the stable major release).
The following modifications have been introduced:

- `@sdk-usage/core`: `createContext` has been renamed to `createInstance`.
- `@sdk-usage/core`: `createSyntaxPlugin` has been renamed to `createPlugin`.
- `@sdk-usage/core`: `plugins` accepts now directly an array of plugins.
- `@sdk-usage/plugin-jsx`: `@sdk-usage/plugin-syntax-jsx` is deprecated (will be removed soon from the registry) and renamed to `@sdk-usage/plugin-jsx`.
- `@sdk-usage/plugin-typescript`: `@sdk-usage/plugin-syntax-typescript` is deprecated (will be removed soon from the registry) and renamed to `@sdk-usage/plugin-typescript`.
