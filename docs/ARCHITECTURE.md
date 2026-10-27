# Scaffold architecture and status

The package is an ESM-first React library built with Vite. React and React DOM are peer dependencies; TypeScript declarations are generated during the library build. Tailwind CSS v4 is an internal authoring/build dependency. The authored stylesheet imports theme and utilities without Preflight, and scopes package tokens under the `--prava-*` prefix.

## Current state

- Package root and aggregate stylesheet exports are declared.
- The token stylesheet is separately exported.
- Storybook uses the React/Vite framework and has a Foundations overview, with no fake component stories.
- Vitest, Testing Library, Playwright, and release-check script entry points are configured.
- Token values are provisional. Brand, font, complete scales, and final theme behavior are not frozen.
- Button is the first representative component and has an aggregate stylesheet plus a granular stylesheet entry point.
- Badge has an aggregate stylesheet import, granular stylesheet entry point, story, and unit coverage; package and cross-browser quality gates remain pending.
- Root exports re-export style-bearing component entries, allowing consumer bundlers to include only styles for used components. Direct `prava-ui/button` and `prava-ui/badge` imports include their matching compiled Tailwind CSS automatically.

## Before component work

The package check installs the packed package in a temporary consumer and verifies root JavaScript tree-shaking, automatic CSS imports, and per-component style selection without consumer Tailwind setup. JavaScript ESM tree-shaking and CSS selection are checked separately. Foundation token values and Button variants remain provisional until the Foundations decisions are approved.

The packed consumer, browser smoke, CI workflow, lockfile, and complete install/build verification remain scaffold completion tasks. No component catalog has been generated. The `prava-ui` name and release metadata remain provisional; verify package availability and release metadata before publishing.
