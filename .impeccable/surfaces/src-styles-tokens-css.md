---
version: 1
slug: "src-styles-tokens-css"
primary_target: "src/styles/tokens.css"
related_targets: ["src/styles/index.css","src/foundations/foundations.stories.tsx"]
---

# Surface: Prava UI component library (all components + Storybook overview)

Mode: Operate. Audience: React developers shipping SaaS/business apps; their end users work in these screens for hours. Constraints: inherit consumer font, no global styles, Tailwind v4 authoring with compiled CSS, logical properties/RTL, WCAG 2.2 AA, semantic tokens are the full theme contract (V2 swaps the whole color set), defaults in `@layer prava.*`.

## Direction contract

THESIS: Controls feel like fired glaze: cool glazed-white surfaces, deep cobalt carrying action and selection. Refuses the category default of flat gray boxes with 1px borders and a stock blue.

OWN-WORLD: Cool blue-tinted near-white grounds (never cream), a second cooler neutral layer for rails and panels, cobalt underglaze accent with pale underglaze tints for soft fills, kiln blue-black for dark mode. Status colors sit on top only where they carry meaning. Original OKLCH values.

STORY: Developers install it and screens look finished; users scan calmly, see the primary action at once, and get precise feedback on every state.

FIRST VIEWPORT: Storybook overview = a SaaS settings screen: neutral rail at inline-start, glazed work area with a General form (focus + invalid states), notifications switches, storage progress with badge, Save as the single cobalt action.

FORM: Cobalt Porcelain, candidate 4 of 7, seed:e8f0c27152c8b31d. Signature move: the glaze rim, a one-hairline inner top highlight on raised controls and surfaces; pressing sinks it (highlight turns to a soft inner shade). Raises: one stroke weight for focus ring, checkbox, progress, spinner (transit); 4px grid, control heights step by 8 (Crouwel); state layers never shift geometry (orienteering); identical slot anatomy and state attributes (character catalog); a few root variables recolor coherently (variable specimen).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
