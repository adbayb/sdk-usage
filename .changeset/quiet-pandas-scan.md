---
"@sdk-usage/cli": patch
"@sdk-usage/core": minor
"@sdk-usage/plugin-jsx": patch
---

Stream SDK usages with backpressure instead of buffering every result in memory, so consumers can process results as they arrive and slow consumers limit read-ahead. When consumed incrementally, memory no longer grows with the total number of results.

- `@sdk-usage/core` (breaking): `getItems()` returns a lazy `AsyncIterable<Item>` instead of `Promise<Item[]>`. Iterate it with `for await`; breaking out of the loop or returning from the iterator cancels the remaining scan.
- `@sdk-usage/core`: `excludeFolders` and `includeFiles` are now applied, files in nested workspace packages are reported once, and versions come from the nearest `package.json`.
- `@sdk-usage/core`: `includeFiles` patterns follow `node:path.matchesGlob`, so dot-prefixed segments must be matched explicitly and a leading `!` does not negate. The `fdir` and `picomatch` dependencies are removed.
- `@sdk-usage/core`: an invalid source file now fails with an error naming the file instead of being skipped silently. Named imports without an alias resolve, and location columns are no longer shifted by one character or skewed by multibyte characters.
- `@sdk-usage/plugin-jsx`: `withSpreading` metadata now reports JSX spread attributes.
- `@sdk-usage/cli`: prints the item count to stderr and exits with code 1 on failure.
