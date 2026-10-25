# Scaffold architecture and status

The package is an ESM-first React library built with Vite. React and React DOM are peer dependencies; TypeScript declarations are generated during the library build. Tailwind CSS v4 is an internal authoring/build dependency. The authored stylesheet imports theme and utilities without Preflight, and scopes package tokens under the `--prava-*` prefix.

## Current state

- Package root and aggregate stylesheet exports are declared.
- The token stylesheet is separately exported.
- Storybook uses the React/Vite framework and has a Foundations overview, with no fake component stories.
- Vitest, Testing Library, Playwright, and release-check script entry points are configured.
- Token values are provisional. Brand, font, complete scales, and final theme behavior are not frozen.
- Button is the first representative component and has an aggregate stylesheet plus a granular stylesheet entry point.

## Before component work

The Button stylesheet is emitted/copied as a granular entry point, but its paths have not yet been validated from a packed consumer fixture without Tailwind setup. Keep aggregate CSS as the simple import path. Do not claim CSS selection/tree-shaking until that fixture proves it. JavaScript ESM tree-shaking and CSS selection are separate checks. Foundation token values and Button variants remain provisional until the Foundations decisions are approved.

The packed consumer, browser smoke, CI workflow, lockfile, and complete install/build verification remain scaffold completion tasks. No component catalog has been generated. The `prava-ui` name and release metadata remain provisional; verify package availability and release metadata before publishing.
