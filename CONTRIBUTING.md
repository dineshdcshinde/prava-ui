# Contributing to Prava UI

Thanks for helping. Bug reports, documentation fixes, and code are all useful, and you don't need to ask before fixing a small bug.

For a new component, a new prop, or anything that changes how the library behaves, please [open an issue](https://github.com/dineshdcshinde/prava-ui/issues) first so we can agree on it before you spend time building it. The product requirements in [docs/Prava-UI-PRD.md](./docs/Prava-UI-PRD.md) are the reference for what belongs in the library.

Everyone taking part is expected to follow the [code of conduct](./CODE_OF_CONDUCT.md).

## Reporting a bug

A good report has:

- the Prava UI, React, and browser versions
- what you did, what you expected, and what happened
- the smallest code that shows the problem

Please report security problems privately. See the [security policy](./SECURITY.md).

## Setting up

You need Node.js 20 or newer.

```sh
git clone https://github.com/dineshdcshinde/prava-ui.git
cd prava-ui
npm install
npm run dev
```

`npm run dev` starts Storybook at <http://localhost:6006>, which is where you'll do most of your work.

| Command                | What it does                                                |
| ---------------------- | ----------------------------------------------------------- |
| `npm run dev`          | Runs Storybook                                              |
| `npm test`             | Runs the unit tests                                         |
| `npm run typecheck`    | Checks types                                                |
| `npm run lint`         | Runs ESLint                                                 |
| `npm run format`       | Formats the code                                            |
| `npm run build`        | Builds the package into `dist/`                             |
| `npm run test:package` | Installs the built package in a temporary app and checks it |
| `npm run test:e2e`     | Runs the browser tests in Chromium                          |
| `npm run test:e2e:all` | Runs them in Chromium, Firefox, WebKit, and emulated phones |

The first time you run browser tests, install the browsers with `npx playwright install`.

## Where things live

```text
src/components/<name>/    Component, stories, tests, and index.ts
src/styles/components/    One stylesheet per component
src/styles/tokens.css     Colors, shadows, spacing, and motion tokens
src/internal/             Shared private helpers (not exported)
scripts/components.mjs    The list of components the build includes
tests/e2e/                Browser tests
docs/                     Requirements, architecture, and release guide
DESIGN.md                 The visual system and its tokens
```

## What every change must keep true

These are requirements, not preferences. A pull request that breaks one needs to be fixed before it can be merged.

- **Accessibility.** Everything works with a keyboard, focus stays visible, controls have accessible names, and state is never shown by color alone. We follow the [WAI-ARIA patterns](https://www.w3.org/WAI/ARIA/apg/).
- **Right-to-left.** Use CSS logical properties such as `margin-inline-start`, not `left` or `right`. Arrow keys and overlays must mirror.
- **Reduced motion.** Motion must explain a state change, and spatial movement stops under `prefers-reduced-motion`.
- **Themes.** Component CSS only uses `--prava-*` tokens and never contains a color value. A test enforces this.
- **Responsive.** Components fit their container down to a 320px screen, without breakpoint props.
- **No global styles.** Never set a font, a reset, or anything on `html` or `body`.
- **No new runtime dependencies** without an agreed reason. React is the only peer dependency.
- **React 18.2 and 19.** Avoid APIs that only exist in React 19.
- **Translated text.** Text the library owns goes through `BuiltInMessages`, so people can translate it.

Prefer the smallest change that fully solves the problem, and reuse what's already there.

## Adding a component

1. Add `src/components/<name>/` with the component, `index.ts`, stories, and tests.
2. Add `src/styles/components/<name>.css`, with its root class named `.prava-<name>` and its rules inside `@layer prava.components`.
3. Register it in all four places: `scripts/components.mjs`, the `exports` in `package.json`, `src/index.ts`, and `src/styles/index.css`.
4. Give each prop a one-line description, and the component a JSDoc comment with an `@example`.
5. Add stories for the main states, narrow screens, and RTL.
6. Add it to the PRD and to `docs/V1-PROGRESS.md`.

Run `npm run build && npm run test:package` afterwards. Stories and tests read the source, so only this proves the component actually reaches people who install the package.

## Sending a pull request

1. Branch from `main`.
2. Make your change, with a test for any new behavior or bug fix.
3. Run these, and make sure they pass:

   ```sh
   npm run typecheck && npm run lint && npm test
   npm run build && npm run test:package
   npm run test:e2e
   ```

4. Add a line to the `Unreleased` section of [CHANGELOG.md](./CHANGELOG.md) if people using the library will notice the change.
5. Open the pull request and describe what changed and why. Add a screenshot for visual changes.

Commit messages follow the style `fix(select): keep the list on screen`, using `feat`, `fix`, `docs`, `test`, or `chore`.

### On Windows

Git may check out files with CRLF line endings, and Prettier expects LF, so `npm run format:check` can report files you never touched. Format only the files you changed: `npx prettier --write <files>`.

## License

By contributing, you agree that your work is released under the [MIT license](./LICENSE).
