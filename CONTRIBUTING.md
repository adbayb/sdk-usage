# Contributing

Thanks for showing interest to contribute to `sdk-usage` 🥳.
We are open to contributions, we look forward to improving it with your help!

Here you will find guidelines that will help you to know how to contribute to this repository.
It can be about reporting an issue, proposing a bug fix, adding some features, and even more...

## 🥇 Your first contribution

Open an issue to report a bug or propose a change, then submit a pull request with a focused fix
or feature. Include tests for behavior changes and describe the validation you ran.

## 🗂️ Conventions

- Use the root scripts for checks and tests: `pnpm check` and `pnpm test`.
- Run `pnpm fix` to format files and apply lint fixes.
- Add a Changesets entry for changes to published packages with `pnpm release:changelog`.
- Use a Conventional Commit-style pull request title.

## 👨‍🍳 Recipes

### How to run checks?

Install dependencies with `pnpm install --frozen-lockfile`, then run:

```sh
pnpm check
pnpm test
```

For a single package, use `pnpm --filter <package> test`.
