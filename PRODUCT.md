# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary:** React developers building production web apps who want a finished, professional interface without doing design work: no picking colors, no theme setup, no styling of interaction states.
- **Their end users:** people working in SaaS and business apps (dashboards, admin panels, forms, settings), often for hours at a time. The default look is tuned for them: calm, easy to scan, not tiring, usable by every age group.
- Product teams that need consistent UI primitives without adopting a large, opinionated framework.

## Product Purpose

Prava UI is an accessible, responsive, customizable React and TypeScript component library. It is a "drop-in replacement for MUI" in spirit: complete, polished defaults so developers never have to design, while Prava keeps its own API (no MUI prop compatibility). Success means a developer installs it and the app already looks finished, works with the keyboard, screen readers and RTL, and fits every screen size.

## Positioning

Four claims the defaults must prove together:

1. **Zero design work:** it looks finished out of the box.
2. **No Tailwind or setup:** compiled CSS, no CSS-in-JS runtime, no required provider.
3. **One-file full theming:** a single CSS file of semantic tokens restyles every component. V2 will generate this file from a user's chosen color.
4. **Accessibility and RTL built in:** keyboard support, accessible names, focus and RTL by default.

## Operating Context

Consumers use Vite, Next.js and similar React toolchains. Components are evaluated in Storybook (the initial docs surface) and inside the consumer's app, where they inherit the host font and sit next to the consumer's own CSS.

## Capabilities and Constraints

- React `>=18.2.0 <20.0.0`. Tree-shakable ESM. Styles authored with Tailwind CSS v4 but shipped as compiled CSS. Minimal runtime dependencies.
- Never imposes a font, global resets, or `html`/`body` styles. Components inherit the consumer's font.
- `PravaProvider` scopes direction, locale and messages (plus theme) to its subtree.
- Customization goes through `className`, `style`, `classNames` slots, CSS custom properties and `data-*` state attributes.
- `docs/Prava-UI-PRD.md` is the source of truth for the catalog (25 components plus Container, Stack and Grid) and for API contracts.
- Undecided: npm name, license approval, browser support matrix, bundle-size budgets.

## Brand Commitments

- The name "Prava UI" is provisional.
- The accent stays in the blue family (with original values). Light mode is the default and dark mode is supported.
- Material Design, Apple HIG and Vercel Geist are conceptual inspiration only. Never copy their tokens, visuals, icons or assets.

## Evidence on Hand

No users, testimonials, benchmarks or case studies exist yet. Do not fabricate any.

## Product Principles

1. **Clarity before decoration:** every visual choice must communicate hierarchy or state.
2. **Adaptive by default:** components fit their container and the viewport without responsive props.
3. **Delight without distraction:** rich interaction feedback that shows state, respects reduced motion, and never delays input.
4. **Customizable by design:** strong defaults with stable hooks. Themes change token values, never component code.
5. **Lightweight by default:** verified against the built package.

## Accessibility & Inclusion

Baseline is WCAG 2.2 AA, following the WAI-ARIA Authoring Practices. Keyboard navigation, visible focus, accessible naming, state announcements, contrast, reduced motion, localization and RTL are requirements, not enhancements.
