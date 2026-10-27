# Prava UI

Prava UI is a lightweight, accessible, responsive, and customizable React component library built with TypeScript and Tailwind CSS v4. It will ship compiled CSS, tree-shakable exports, TypeScript types, design tokens, and documentation, with no Tailwind setup required for consumers.

This repository is at the **scaffold stage**. The product requirements live in [docs/Prava-UI-PRD.md](docs/Prava-UI-PRD.md). Component implementations will be added one at a time after the foundation and CSS packaging strategy are verified. Brand and design tokens remain provisional.

## Development

Use Node.js 20 or newer. The repository uses npm for its initial scaffold.

```sh
npm install
npm run dev          # Storybook
npm run build        # Library JavaScript, declarations, and CSS
npm run typecheck
npm test
```

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for current scaffold status and unresolved packaging decisions.

## Button

Importing a component automatically includes its compiled styles. The root entry includes styles for components your bundler keeps; a component entry loads only that component and its styles:

```tsx
import { Button } from 'prava-ui/button';

<Button variant="primary" size="md">Save</Button>
```

Button supports native button attributes, `variant` (`primary`, `secondary`, `outline`, `ghost`, `destructive`), `size` (`sm`, `md`, `lg`), and `loading`. Loading sets `aria-busy` and disables the native button. Use native accessible naming such as visible text or `aria-label` for icon-only content. `className` and `style` are forwarded; styles inherit the consumer font and use the shared `--prava-*` tokens.

## Badge

```tsx
import { Badge } from 'prava-ui/badge';
import { Button } from 'prava-ui/button';

<Badge content="3"><Button>Inbox</Button></Badge>
```

Badge anchors a compact, non-interactive indicator over a child element such as a Button. It requires `content` and the element as `children`; it supports `tone` (`neutral`, `primary`, `success`, `warning`, `danger`, `info`), `size` (`sm`, `md`), native span attributes, `className`, and `style`. Its visible content must communicate the status; color is only a visual treatment. Component imports include their styles automatically. The root import includes styles for components kept by the consumer's bundler; component entry imports include only that component's styles. For manual CSS imports, include shared `styles/tokens.css` with the selected component stylesheet.
