# Scaffold architecture and status

The package is an ESM-first React library built with Vite. React and React DOM are peer dependencies; TypeScript declarations are generated during the library build. Tailwind CSS v4 is an internal authoring/build dependency: component stylesheets use `@reference 'tailwindcss'` and `@apply` only, so no Tailwind theme variables, Preflight, or utility classes ship. Package tokens are scoped under the `--prava-*` prefix.

## Current state

- Package root and aggregate stylesheet exports are declared.
- The token stylesheet is separately exported.
- Storybook uses the React/Vite framework and has a Foundations overview, with no fake component stories.
- Vitest, Testing Library, Playwright, and release-check script entry points are configured.
- The visual world is Cobalt Porcelain, recorded in the root `DESIGN.md` (tokens, scales, theme contract) and in `PRODUCT.md` (product truth). Semantic `--prava-color-*`/`--prava-shadow-*` tokens are the complete theme contract; `foundations.test.ts` enforces AA contrast, dark/system parity, and no color literals in component CSS.
- Tokens ship in `@layer prava.tokens` and component rules in `@layer prava.components`, so unlayered consumer CSS and themes always win. The package check fails if the aggregate stylesheet contains any unscoped selector.
- Light is the default; `data-prava-theme="light|dark|system"` can be set on any element. Prava never styles the host `:root`.
- `PravaProvider` (`prava-ui/provider`) scopes `direction`, `locale`, `messages`, and `theme` to its subtree via a `display: contents` wrapper; one shared context chunk serves every entry. `BuiltInMessages` currently covers `required` and `loading`.
- Form controls share one core (`src/components/field/field.tsx`, styles in `field.css`): ids, ARIA, `description`/`error` messages, localized native validation from `BuiltInMessages`, and the Checkbox/Switch/Radio markup. `scripts/components.mjs` is the single component registry for build entries, CSS, and package checks; `fieldControls` entries auto-import `field.css`.
- Input controls connect to form libraries through the `field` prop (`bindField` in `field.tsx`), which accepts react-hook-form's `register()` output or `Controller`'s `field`; both are covered for every control in `field/react-hook-form.test.tsx`. Input's floating label follows the DOM value via `:placeholder-shown`.
- Select is a custom listbox over a hidden native `<select>`, which stays the real form control for names, native validation, and react-hook-form. Its popup uses the native Popover API, so it needs no overlay dependency and isn't clipped by parents. `onPropertyWrite` in `field.tsx` catches direct DOM writes from react-hook-form's `reset` and `setValue`; Textarea reuses it for auto-grow in browsers without `field-sizing`.
- Every component is on Cobalt Porcelain foundations. Storybook `Overview` shows a full settings screen in light, dark, and RTL. The Storybook toolbar switches theme and direction on every story; `tests/e2e/theme.spec.ts` verifies that a full token swap leaves no default color.
- Redesigned on the new foundations: Button (`startIcon`/`endIcon`, `fullWidth`, `href` links, focusable `aria-disabled` loading, Spinner reuse), Spinner (`tone`, track ring, reduced-motion fade), and Input (`startIcon`/`endIcon`, 3:1 control boundary). Remaining components still use their earlier styling but the shared tokens.
- Button is the first representative component and has an aggregate stylesheet plus a granular stylesheet entry point.
- Badge has an aggregate stylesheet import, granular stylesheet entry point, story, and unit coverage; package and cross-browser quality gates remain pending.
- Avatar and Spinner have aggregate and granular stylesheets, component entry points, stories, and unit coverage; package and cross-browser quality gates remain pending.
- Input has aggregate and granular stylesheets, component entry points, stories, and unit coverage; package and cross-browser quality gates remain pending.
- Card has a root and composable header/content/footer parts, aggregate and granular stylesheets, a component entry point, autodocs, stories, and unit coverage; browser validation is pending.
- Separator, Skeleton, and Progress have focused APIs, aggregate and granular stylesheets, component entry points, autodocs, stories, and unit coverage; browser validation is pending.
- Textarea, Label, and FormField provide the next forms increment with native control semantics, stable accessible associations, aggregate and granular stylesheets, autodocs, stories, and unit coverage.
- Root exports re-export style-bearing component entries, allowing consumer bundlers to include only styles for used components. Direct component imports include their matching compiled Tailwind CSS automatically.

## Before component work

The package check installs the packed package in a temporary consumer and verifies root JavaScript tree-shaking, automatic CSS imports, and per-component style selection without consumer Tailwind setup. JavaScript ESM tree-shaking and CSS selection are checked separately. Shared theme tokens let future customer themes override colors and shape without changing component classes or APIs; a theme builder is a V2 direction, not implemented here.

The packed consumer, browser smoke, CI workflow, lockfile, and complete install/build verification remain scaffold completion tasks. No component catalog has been generated. The `prava-ui` name and release metadata remain provisional; verify package availability and release metadata before publishing.
