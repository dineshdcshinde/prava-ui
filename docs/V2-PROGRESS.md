# V2 Progress

**In progress.** Plan and requirements are in [PRD Part II](./Prava-UI-PRD.md#part-ii-v2). Nothing here is committed yet.

**8 of 16 new components have finished their first build.** The other 2 of this batch are still being built. "Agent tests" below are results reported by the agent that built the component. They haven't yet been re-run together, so no component is signed off.

## Components

| #   | Component           | Wave | Status   | Agent tests (unit / Chromium) |
| --- | ------------------- | ---- | -------- | ----------------------------- |
| 29  | Table               | 1    | Built    | 15 / 5                        |
| 30  | Pagination          | 1    | Built    | 36 / 11                       |
| 31  | Breadcrumb          | 1    | Built    | 13 / 7                        |
| 32  | Combobox            | 1    | Building | Not reported                  |
| 33  | DatePicker/Calendar | 1    | Building | Not reported                  |
| 34  | Slider              | 1    | Built    | 28 / 40 across 3 browsers (2 skipped) |
| 35  | NumberInput         | 1    | Built    | 50 / 11                       |
| 36  | FileUpload          | 1    | Built    | 26 / 9 (flaky under parallel load) |
| 37  | DataTable           | 2    | Not started | None                       |
| 38  | CommandPalette      | 2    | Not started | None                       |
| 39  | ToggleGroup         | 2    | Not started | None                       |
| 40  | Stepper             | 2    | Not started | None                       |
| 41  | Tag                 | 2    | Built    | 10 / 12 (1 optional skipped)  |
| 42  | Link                | 2    | Not started | None                       |
| 43  | EmptyState          | 2    | Built    | 7 / 7                         |
| 44  | Sidebar             | 2    | Not started | None                       |

## Done

- V2 PRD written (Part II of `docs/Prava-UI-PRD.md`).
- `--prava-color-primary-text` token added and used in Input and Tabs, with a contract test.
- All 10 components in this batch registered in `scripts/components.mjs`, `package.json` exports and `src/styles/index.css`.
- New library text added to `BuiltInMessages`.

## Not done yet

**This batch**

- Add the root exports in `src/index.ts`. Until then, these components can't be imported from `prava-ui`.
- Full run together: typecheck, lint, all unit tests, Firefox and WebKit, production build, packed-package test.
- Theme proof (PRD section 27) for each new component.
- Record the final APIs in the PRD.

**Rest of V2**

- 6 remaining components: DataTable, CommandPalette, ToggleGroup, Stepper, Link, Sidebar.
- Colour engine, `prava.theme.css` generation, CLI, Vite plugin, Next.js spike.
- Presets, builder page, hosted Storybook.
- API gap audit of the existing 28.
- Hosted AI suggestions.

**Still open from V1**

- React 18.2 consumer check, manual screen reader pass, real touch devices. V2 is running alongside these because the owner asked to start now.

## i18n check (2026-11-05)

Library code has no translation dependency, as the PRD requires. A temporary test passed a stand-in component shaped like `<Trans>` into existing components. The real `react-i18next` and Lingui packages weren't tested, because neither is installed.

**Works with `<Trans>`:** Button, Input, FormField, Checkbox, Switch, RadioGroup, Select, Dialog, Alert, Tabs, Accordion, Tooltip, DropdownMenu (including typeahead) and Toast.

**Not fully tested:** Popover's types accept `<Trans>` and it renders without error, but the test didn't check its title text. The other 11 existing components and the 10 new V2 components weren't tested.

**Fixed:** `Progress` and `Spinner` `label` now accept `<Trans>`. Plain string labels behave as before.

**Gaps found, not fixed yet:**

- `README.md` has no `<Trans>` or i18n library example. PRD section 7 requires integration examples.
- `BuiltInMessages` values are strings, so use `t("...")` for them rather than `<Trans>`. This is deliberate, because many become `aria-label`s.

## Decisions made without the owner

The owner asked for work to continue without waiting. These can be changed:

- Components are being built before the theme engine and in parallel, not one at a time as PRD section 28 says. Owner instruction.
- Very light brand colours: PRD section 23.3 default stands until the engine is built.
- Nothing is committed or pushed until the owner asks.
