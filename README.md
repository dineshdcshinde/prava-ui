# Prava UI

Prava UI is a lightweight, accessible, responsive, and customizable React component library built with TypeScript and Tailwind CSS v4. It will ship compiled CSS, tree-shakable exports, TypeScript types, design tokens, and documentation, with no Tailwind setup required for consumers.

This component catalog is being built incrementally against the product requirements in [docs/Prava-UI-PRD.md](docs/Prava-UI-PRD.md). The visual foundation is documented in [DESIGN.md](DESIGN.md); components use shared color and shape tokens so themes can override values without changing class names.

## Development

Use Node.js 20 or newer. The repository uses npm for its initial scaffold.

```sh
npm install
npm run dev          # Storybook
npm run build        # Library JavaScript, declarations, and CSS
npm run typecheck
npm test
```

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for current implementation and packaging status.

## Button

Importing a component automatically includes its compiled styles. The root entry includes styles for components your bundler keeps; a component entry loads only that component and its styles:

```tsx
import { Button } from "prava-ui/button";

<Button variant="primary" size="md">
  Save
</Button>;
```

Button supports native button attributes, `variant` (`primary`, `secondary`, `outline`, `ghost`, `destructive`), `size` (`sm`, `md`, `lg`), `type="icon"`, and `loading`. Icon-only buttons default to the transparent `ghost` treatment; set a `variant` to choose another treatment. Loading sets `aria-busy`, disables the native button, hides its content without changing its width, and centers the loading indicator. Choose the indicator with `loadingVariant` (`spinner`, `dots`, `bars`, `pulse`, `bounce`). Use native accessible naming such as visible text or `aria-label` for icon-only content. `className` and `style` are forwarded; styles inherit the consumer font and use the shared `--prava-*` tokens.

## Input

```tsx
import { Input } from 'prava-ui/input';

<label htmlFor="email">Email</label>
<Input id="email" name="email" type="email" autoComplete="email" required />
```

Input forwards native input attributes, fills its parent width, and supports `size` (`sm`, `md`, `lg`), `invalid`, an optional floating `label`, and `leftIcon`/`rightIcon`. The label floats above the field on focus and stays floated when a value is present; it remains associated with the input for assistive technology. Set `invalid` to apply invalid styling and `aria-invalid`; descriptions and error text remain consumer markup and can be associated with `aria-describedby`. A `disabledReason` is shown and associated accessibly when the native `disabled` prop is true. A numeric `size` preserves the native HTML attribute. If `label` is omitted, provide a visible external label or an accessible name; a placeholder is not a label.

## Textarea, Label, and FormField

```tsx
import { FormField } from "prava-ui/form-field";
import { Input } from "prava-ui/input";
import { Textarea } from "prava-ui/textarea";

<FormField
  label="Work email"
  required
  description="Used for account updates and sign-in."
  error="Enter a valid email address."
  control={<Input type="email" />}
/>
<FormField label="Message" control={<Textarea rows={4} resize="vertical" />} />
```

`FormField` accepts one control, creates a stable ID when needed, carries existing `aria-describedby` IDs forward, and associates description/error text. It adds the required state and invalid state when requested. Use `Label` directly for other native controls, or `Textarea` directly when you need native multiline attributes/ref and an explicit resize policy. Textarea height remains controlled by `rows`; it does not auto-resize.

Pass decorative icons through `leftIcon` and `rightIcon`; they follow text direction and do not replace the label. The ref points to the native `<input>`, and native `name`, `disabled`, `onChange`, and `onBlur` props are forwarded, so React Hook Form registration works directly:

```tsx
import { useForm } from "react-hook-form";
import { Input } from "prava-ui/input";

function EmailForm() {
  const { register } = useForm<{ email: string }>();
  return <Input label="Email" type="email" {...register("email")} />;
}
```

## Card

```tsx
import { Card, CardContent, CardFooter, CardHeader } from "prava-ui/card";

<Card>
  <CardHeader>
    <h2>Account</h2>
    <p>Manage your profile.</p>
  </CardHeader>
  <CardContent>Account details go here.</CardContent>
  <CardFooter>
    <button type="button">Edit</button>
  </CardFooter>
</Card>;
```

Card provides optional `CardHeader`, `CardContent`, and `CardFooter` parts. It adds no click behavior; consumers choose headings and actions. Each part forwards its native element attributes and supports `className` and `style`.

## Separator

```tsx
import { Separator } from 'prava-ui/separator';

<Separator />
<Separator decorative={false} orientation="vertical" />
```

Separator is decorative by default. Set `decorative={false}` when it marks a meaningful boundary for assistive technology. Its orientation defaults to horizontal.

## Skeleton

```tsx
import { Skeleton } from 'prava-ui/skeleton';

<Skeleton shape="circle" style={{ width: 44 }} />
<Skeleton shape="text" style={{ width: '60%' }} />
```

Skeleton reserves space for content and is hidden from assistive technology. Set dimensions through `style` to match the content being replaced. Its restrained opacity animation stops for reduced-motion users.

## Progress

```tsx
import { Progress } from 'prava-ui/progress';

<Progress label="File upload" value={64} />
<Progress label="Preparing report" />
```

Progress supports a determinate `value` with optional `min`/`max` (defaults 0/100) or an indeterminate state when `value` is omitted. Values are clamped, invalid ranges are rejected, and `label` provides the accessible name.

## Themes and colors

Light tokens are the default. Set `data-prava-theme="dark"` or `data-prava-theme="light"` on the document root or a subtree to select a theme. Buttons, inputs, cards, and badges use the shared palette from `DESIGN.md`; components keep their styles in component CSS and use shared tokens rather than inline static styles.

## Badge

```tsx
import { Badge } from "prava-ui/badge";
import { Button } from "prava-ui/button";

<Badge content="3">
  <Button>Inbox</Button>
</Badge>;
```

Badge anchors a compact, non-interactive indicator over a child element such as a Button. It requires `content` and the element as `children`; it supports `tone` (`neutral`, `primary`, `success`, `warning`, `danger`, `info`), `size` (`sm`, `md`), native span attributes, `className`, and `style`. Its visible content must communicate the status; color is only a visual treatment. Component imports include their styles automatically. The root import includes styles for components kept by the consumer's bundler; component entry imports include only that component's styles. For manual CSS imports, include shared `styles/tokens.css` with the selected component stylesheet.

## Avatar

```tsx
import { Avatar } from 'prava-ui/avatar';

<Avatar firstName="Fatima" lastName="Lovelace" />
<Avatar src="/people/fatima.jpg" firstName="Fatima" lastName="Lovelace" />
```

Avatar displays an image when `src` loads, and otherwise shows the first letters of `firstName` and `lastName` (`FL` in this example). A failed image uses the same fallback. Pass `alt` for an entity image or a custom accessible name; `fallback` replaces the initials. It supports `size` (`sm`, `md`, `lg`), native span attributes, `className`, and `style`.

## Spinner

```tsx
import { Spinner } from "prava-ui/spinner";

<Spinner label="Loading results" />;
```

Spinner indicates an ongoing process and supports `variant` (`spinner`, `dots`, `bars`, `pulse`, `bounce`), `size` (`sm`, `md`, `lg`), and `theme` (`primary`, `neutral`, `success`, `warning`, `danger`, `info`). Themes use Prava color tokens and follow the active light or dark theme. Pass `color` for a CSS color or custom property such as `var(--my-accent)` to override the semantic theme. The indicator is decorative by default; pass `label` when the loading status should be announced to assistive technology. Its animation stops for reduced-motion preferences.
