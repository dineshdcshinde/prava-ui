# Prava UI Design Guide

Prava UI's visual world is **Cobalt Porcelain**: glazed, cool white surfaces with deep cobalt reserved for action and selection. Components use shared tokens, so the library looks consistent by default, and a theme can restyle it without changing component class names or APIs. This file records the current tokens. The full guide is completed when the component redesign finishes.

## Direction

- Surfaces are cool, slightly blue-tinted near-whites (never cream). A second, cooler neutral layer (`surface-sunken`) is for rails, toolbars and panel backgrounds.
- Cobalt carries the primary action, the current selection and focus, and nothing else. Status colors appear only where they carry meaning.
- Dark mode is "kiln": layered blue-black surfaces with a lighter cobalt.
- **Signature, the glaze rim:** raised controls and surfaces have a one-hairline highlight along their top edge. Pressing sinks it to a soft inner shade. Never more than one hairline.
- Disciplines: one stroke weight (`--prava-stroke`) for focus rings, checkbox marks, and progress and spinner tracks. A 4px spacing grid, with control heights stepping in 8px. State layers (hover, selected, focus) never shift geometry. Every component uses the same slot anatomy and `data-*` state attributes.

## Theme contract

The semantic `--prava-color-*` and `--prava-shadow-*` tokens in `src/styles/tokens.css` are the complete theme contract. Component CSS never contains a color literal (a test enforces this). A theme file that redefines every contract token, for light and for `[data-prava-theme='dark']`, restyles every component. A partial theme falls back to Prava's values.

Defaults ship in `@layer prava.tokens` and `@layer prava.components`, so any unlayered consumer or theme CSS wins regardless of import order. Tailwind v4 consumers who want their utilities to beat Prava should declare `@layer prava;` before importing Tailwind.

Light is the default. Choose a theme with `data-prava-theme="light | dark | system"` on any element, or with `PravaProvider`'s `theme` prop. Prava never sets `color-scheme` or any other style on the host `:root`. Themes nest: any subtree can pick its own, and `system` resets to the OS preference even inside a dark subtree. `--prava-color-scheme` (`light` or `dark`) is part of the contract so native popups, date icons, and scrollbars on controls follow the theme.

To replace the theme, load a plain unlayered stylesheet that sets every `--prava-color-*` and `--prava-shadow-*` token on `:root, [data-prava-theme]`. `tests/e2e/theme.spec.ts` proves that this leaves no default color on the Overview screen. In Storybook, the toolbar switches theme and direction on every story.

| Role                      | Token                                     | Light                             | Dark                              |
| ------------------------- | ----------------------------------------- | --------------------------------- | --------------------------------- |
| Canvas                    | `color-canvas`                            | `#F2F5F9`                         | `#0C1019`                         |
| Surface                   | `color-surface`                           | `#FBFCFE`                         | `#151924`                         |
| Sunken layer              | `color-surface-sunken`                    | `#E8ECF4`                         | `#11151E`                         |
| Hover surface             | `color-surface-hover`                     | `#EBEFF6`                         | `#1E2430`                         |
| Raised surface            | `color-surface-raised`                    | `#DFE5EF`                         | `#252B39`                         |
| Border                    | `color-border`                            | `#D3D9E3`                         | `#2F3543`                         |
| Control border (≥3:1)     | `color-border-strong`                     | `#778193`                         | `#697284`                         |
| Text                      | `color-text`                              | `#171E2C`                         | `#E6E9F0`                         |
| Muted text                | `color-text-muted`                        | `#555E6F`                         | `#A8AEBB`                         |
| Primary / hover / active  | `color-primary(-hover/-active)`           | `#2B4DB5` / `#213F9F` / `#1A358D` | `#8AACFA` / `#A0BDFF` / `#7E9FED` |
| On primary                | `color-on-primary`                        | `#FAFCFF`                         | `#091431`                         |
| Primary soft fill / text  | `color-(on-)primary-container`            | `#DFEAFF` / `#1C3788`             | `#22335E` / `#D5E1FD`             |
| Focus                     | `color-focus`                             | `#3760D8`                         | `#93B5FF`                         |
| Success fill / text       | `color-(on-)success`                      | `#DDF7E6` / `#125B3A`             | `#153524` / `#A1E7BE`             |
| Warning fill / text       | `color-(on-)warning`                      | `#FFF1D1` / `#7F490C`             | `#422F13` / `#F9D280`             |
| Danger solid / hover / on | `color-danger(-hover)`, `color-on-danger` | `#C22826` / `#A91518` / `#FEFBFA` | `#F17871` / `#FC928A` / `#290B0A` |
| Danger soft fill / text   | `color-(on-)danger-container`             | `#FFE8E6` / `#8D2521`             | `#551F1D` / `#FFD5D1`             |
| Info fill / text          | `color-(on-)info`                         | `#DDF3FF` / `#005581`             | `#163347` / `#A8DCFC`             |

Scrim behind modal overlays: `color-scrim` (`rgb(23 30 44 / 0.4)` light, `rgb(4 6 12 / 0.6)` dark).

Shadows: `shadow-control`, `shadow-control-hover`, `shadow-control-filled` (glaze rim on filled controls), `shadow-pressed`, `shadow-raised` (cards, panels) and `shadow-overlay` (popovers, menus, dialogs, drawers, toasts; it carries the glaze rim too). Every text, status and focus pair meets WCAG AA in both themes, and `foundations.test.ts` checks this.

## Scales

- **Type:** `--prava-font-size-1…7` (12, 13, 14, 16, 18, 22, 28px; a ratio of about 1.2), `--prava-line-height-tight|normal`, and `--prava-font-weight-regular|medium|semibold`. The font family is always inherited from the consumer.
- **Spacing:** Tailwind's 4px scale, compiled into each component stylesheet.
- **Control heights:** `--prava-control-height-sm|md|lg` (32, 40, 48px).
- **Radii:** `--prava-radius-sm` (4px; checkbox and badge-scale elements), `--prava-radius-control` (8px), `--prava-radius-card` (14px), `--prava-radius-full`.
- **Stroke:** `--prava-stroke` (2px).
- **Motion:** `--prava-duration-fast|normal|slow` (120, 200, 320ms), `--prava-ease-standard` (exponential ease-out) and `--prava-ease-press`. Reduced motion removes all spatial movement and keeps fades, so state changes stay visible.

## Motion

Motion explains a state change; nothing moves for decoration and nothing loops. Entrances use `duration-normal` or `duration-slow` with `ease-standard`; exits use `duration-fast`, so closing never delays the next action.

| Component     | Motion                                                               | Why                                    |
| ------------- | -------------------------------------------------------------------- | -------------------------------------- |
| Dialog        | Settles from 0.5rem below at 98% scale; the scrim fades              | A new layer arrives without a jump     |
| Drawer        | Slides from its edge, mirrored in RTL                                | Shows where it lives and where it goes |
| Popover, Menu | Rises 0.25rem out of the anchor's edge                               | Ties the popup to what opened it       |
| Tooltip       | The same rise, at a small size                                       | Never competes with what it describes  |
| Tabs          | One indicator glides between tabs (transforms only); the panel fades | Shows where selection came from        |
| Accordion     | Rows animate to the content's real height; the chevron turns         | Keeps the reader's place in the list   |
| Toast         | Arrives from the edge it lives on; leaving also collapses its row    | The stack closes up instead of jumping |
| Alert         | Fades in                                                             | Appears without pulling focus          |

## Authoring rules

- Component CSS reads tokens through Tailwind v4's `(--prava-*)` syntax and uses Tailwind's spacing scale. No `[arbitrary]` values and no dynamically built class names.
- Each component keeps its static styles in its own stylesheet, inside `@layer prava.components`, with stable root and slot classes.
- Components inherit the consumer's font. Never load fonts or add global resets or page-level styles.
- Use logical properties for direction-aware layout. Keep focus visible, and respect reduced motion.
