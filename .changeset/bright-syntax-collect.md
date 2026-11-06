---
"@sdk-usage/core": minor
"@sdk-usage/cli": patch
"@sdk-usage/plugin-jsx": minor
"@sdk-usage/plugin-typescript": minor
---

Dispatch plugins by SWC node type, enabling TypeScript collection in the parser. Collect imported
TypeScript references (including qualified/inline types, interface heritage, and `typeof` queries),
JSX member-expression components, and namespaced JSX tags and attributes. Represent unsupported
JSX expressions with typed tokens, pass plugin helpers through one input object, and enable the
JavaScript plugin in the CLI.
