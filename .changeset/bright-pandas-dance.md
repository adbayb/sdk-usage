---
"@sdk-usage/cli": patch
"@sdk-usage/core": patch
"@sdk-usage/plugin-jsx": minor
"@sdk-usage/plugin-typescript": minor
---

Replace the default exports from the JSX and TypeScript plugins with a named `plugin` export. This is a breaking change for consumers of either plugin. Update the CLI to use the named exports and fix parser/type-check issues.
