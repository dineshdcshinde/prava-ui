# Prava UI Design Guide

This guide defines Prava UI's visual foundation. Components use these shared tokens so the library looks consistent by default and can accept customer themes later without changing component class names or APIs.

## Direction

Use quiet, near-white surfaces in light mode and layered obsidian surfaces in dark mode. Blue and cyan provide the main action color; lavender is reserved for future accent use. Status colors use soft fills with readable foregrounds. Keep the interface clear and compact; use borders and small tonal steps for hierarchy instead of decorative effects.

## Color tokens

Light is the default. Dark mode is selected with `data-prava-theme="dark"`; set the attribute on the document root or a subtree. Use `data-prava-theme="light"` to restore light tokens inside a dark subtree.

| Role | Light | Dark |
| --- | --- | --- |
| Canvas | `#FBFBFA` | `#121318` |
| Surface | `#FFFFFF` | `#1A1B21` |
| Hover surface | `#F1F5F9` | `#292A2F` |
| Raised surface | `#E2E8F0` | `#34343A` |
| Main text | `#11181C` | `#E3E1E9` |
| Muted text | `#475569` | `#BFC7D2` |
| Border | `#CBD5E1` | `#3F4850` |
| Primary action | `#0369A1` | `#93CCFF` |
| Primary action text | `#FFFFFF` | `#003351` |
| Primary soft fill / text | `#E0F2FE` / `#003351` | `#3198DC` / `#002C47` |
| Success fill / text | `#ECFDF3` / `#067647` | `#183B2A` / `#A6F4C5` |
| Warning fill / text | `#FFFAEB` / `#93370D` | `#3D3013` / `#FEC84B` |
| Danger fill / text | `#FEF3F2` / `#7A271A` | `#93000A` / `#FFDAD6` |
| Info fill / text | `#F0F9FF` / `#026AA2` | `#0B3145` / `#7CD4FD` |
| Focus indicator | `#0284C7` | `#93CCFF` |

The CSS custom properties in `src/styles/tokens.css` are the implementation contract. Use semantic names such as `--prava-color-primary`, `--prava-color-on-primary`, and paired status tokens. Keep raw color values out of component styles. Text and focus colors must remain distinguishable from their adjacent surfaces.

## Shape and component styling

- Controls use the shared `--prava-radius-control` token (6px); cards use `--prava-radius-card` (8px). Use pill shapes only when the component's meaning calls for them, such as compact badges.
- Each component keeps its static styles in its component CSS file and applies its existing root/slot classes. Use shared tokens for color, shape, and other themeable values.
- Keep stable class names and component APIs independent of a theme. A theme changes token values; it does not require component-specific overrides or generated class names.
- Components inherit the consumer's font. Do not load or impose fonts, global resets, or page-level styles.
- Keep focus visible, respect reduced motion, and use logical CSS properties for direction-aware layout.

## Customer themes

V1 ships Prava's own light and dark themes and the stable token contract. A future theme builder can preview the component catalog and export a small CSS file that overrides these variables. Keep token names and meanings stable so a generated theme can style every component without adding runtime code or changing component class names. AI is not required to apply a theme; any future AI suggestions must use the same fixed token contract.
