# Contributing

Thank you for helping. Read `AGENTS.md` first: it has the structure, the commands and the rules every change follows.

## Issues

- A bug: the package and version, what you did, what you expected, what happened. A small example helps most.
- A new component or option: the problem it solves first. A component goes in only when more than one project needs it.

## Pull requests

1. One change per pull request. Open an issue first for a large change.
2. Every component works in English and Arabic (RTL), in dark and light, with the keyboard, and passes WCAG AA.
3. Built-in strings go in both languages (`packages/ui/src/i18n/strings.ts`).
4. Add or change tests. Run `bun test` and `bun run typecheck`.
5. A new or changed component: update its docs example and page, then run `bun run registry`.
6. Add a line to `CHANGELOG.md` under the next version. Link the name of a new component to its docs page: `[Name](https://design.percent.sa/en/components/<slug>)`.

By contributing, you agree that your contribution is licensed under the MIT license of this project.

Everyone in this project follows the code of conduct (`CODE_OF_CONDUCT.md`).
