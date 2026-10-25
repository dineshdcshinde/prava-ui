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

Import the component and either the aggregate stylesheet or the Button stylesheet with shared tokens:

```tsx
import { Button } from 'prava-ui';
import 'prava-ui/styles.css';
// Or, for CSS selection: import 'prava-ui/styles/tokens.css'; import 'prava-ui/styles/components/button.css';

<Button variant="primary" size="md" onClick={save}>Save</Button>
```

Button supports native button attributes, `variant` (`primary`, `secondary`, `outline`, `ghost`, `destructive`), `size` (`sm`, `md`, `lg`), and `loading`. Loading sets `aria-busy` and disables the native button. Use native accessible naming such as visible text or `aria-label` for icon-only content. `className` and `style` are forwarded; styles inherit the consumer font and use the shared `--prava-*` tokens.
