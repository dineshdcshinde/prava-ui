# Prava UI

Accessible, responsive React components that look finished the moment you install them. No Tailwind setup, no CSS-in-JS runtime, and no runtime dependencies.

[![npm version](https://img.shields.io/npm/v/@pravalabs/ui/next?label=npm%40next)](https://www.npmjs.com/package/@pravalabs/ui?activeTab=versions)
[![license: MIT](https://img.shields.io/npm/l/@pravalabs/ui)](./LICENSE)
[![CI](https://github.com/dineshdcshinde/prava-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/dineshdcshinde/prava-ui/actions/workflows/ci.yml)

> **Release candidate.** The API is close to final, but it can still change before `1.0.0`. Please try it and [report what you find](https://github.com/dineshdcshinde/prava-ui/issues).

## Why Prava UI

- **No design work.** Polished defaults for every state, in light and dark.
- **No setup.** Styles are compiled and load automatically. You don't need Tailwind or a provider.
- **Keyboard, screen reader, and RTL support built in.** They're part of each component, not an add-on.
- **Fits any screen.** Components adapt to their container with no breakpoint props.
- **Easy to theme.** One CSS file of tokens restyles everything, and your CSS always wins.
- **Only what you import.** Each component brings its own JavaScript and CSS.

## Getting started

Prava UI needs React 18.2 or newer, including React 19.

```sh
npm install @pravalabs/ui@next
```

Import a component and use it. Its styles come with it:

```tsx
import { Button, Dialog, DialogClose, Input } from "@pravalabs/ui";

export function InviteTeammate() {
  return (
    <Dialog
      trigger={<Button>Invite</Button>}
      title="Invite a teammate"
      description="They get an email with a link to join."
      footer={
        <>
          <DialogClose>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button>Send invite</Button>
        </>
      }
    >
      <Input label="Work email" type="email" />
    </Dialog>
  );
}
```

You can also import one component at a time, such as `import { Button } from "@pravalabs/ui/button"`.

Styles load automatically with Vite, webpack, Rspack, Parcel, and Next.js. esbuild writes them to a separate `.css` file next to your bundle, which you link from your page. With Vite, webpack, and Next.js, you get only the CSS for the components you use and the components they render, such as Alert inside Toast; Next.js loads it per page. With esbuild and plain Rollup, importing from the package root includes CSS for every component; import from component paths like `@pravalabs/ui/button` if CSS size matters. Parcel needs `"@parcel/resolver-default": { "packageExports": true }` in your `package.json` to resolve component paths.

Components inherit your app's font. Prava UI never loads a font or adds global styles to your page.

### Next.js

Works in the App Router: you can use components directly in Server Components, because the package marks its own client code. Functions such as `onClick` still have to be passed from a Client Component, as with any React component. Call `toast()` from client code too.

## Components

| Group      | Components                                                                              |
| ---------- | --------------------------------------------------------------------------------------- |
| Actions    | `Button`                                                                                |
| Forms      | `Input`, `Textarea`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `Label`, `FormField` |
| Display    | `Avatar`, `Badge`, `Card`, `Separator`, `Skeleton`, `Spinner`, `Progress`               |
| Feedback   | `Alert`, `Toaster` with `toast()`                                                       |
| Overlays   | `Dialog`, `Drawer`, `Popover`, `Tooltip`, `DropdownMenu`                                |
| Navigation | `Tabs`, `Accordion`                                                                     |
| Layout     | `Container`, `Stack`, `Grid`                                                            |
| Setup      | `PravaProvider` (optional: direction, locale, messages, and theme for part of your app) |

Form controls connect to [react-hook-form](https://react-hook-form.com/) through a `field` prop, with no extra dependency:

```tsx
<Input label="Email" field={register("email")} error={errors.email?.message} />
```

## Documentation

Every component has live examples and an API reference in Storybook. A hosted version isn't available yet, so run it locally:

```sh
git clone https://github.com/dineshdcshinde/prava-ui.git
cd prava-ui
npm install
npm run dev
```

Your editor also shows the docs: each prop and component has a description and an example inline.

## Theming

Light is the default. Choose a theme for the whole page or any part of it:

```html
<body data-prava-theme="dark">
  ...
</body>
<section data-prava-theme="system">...</section>
```

To use your brand's colors, override the tokens in your own CSS. Prava UI's styles sit in a cascade layer, so yours win whatever the import order:

```css
:root {
  --prava-color-primary: #7c3aed;
  --prava-color-primary-hover: #6d28d9;
  --prava-color-primary-active: #5b21b6;
}
```

Every component also takes `className` and `style`, and compound ones take `classNames` for their inner parts. See [DESIGN.md](./DESIGN.md) for all the tokens.

## Right-to-left and translations

Prava UI has no translation dependency, so it works alongside whichever library you already use. `PravaProvider` sets direction, locale, and the library's own text for its subtree:

```tsx
import { PravaProvider } from "@pravalabs/ui";

<PravaProvider direction="rtl" locale="ar" messages={{ close: "إغلاق" }}>
  <App />
</PravaProvider>;
```

It only affects what's inside it. To change the whole page, set `<html dir="rtl">` yourself as well.

## Browser support

Tests run on current Chromium, Firefox, and WebKit, plus emulated phones. Overlays use the native `<dialog>` element and Popover API, so they need Chrome or Edge 114, Firefox 125, or Safari 17 and newer. Browsers that don't support the newest animation features still work, and overlays just close without animating.

## Contributing

Bug reports, ideas, and pull requests are all welcome. Start with the [contributing guide](./CONTRIBUTING.md), and please follow the [code of conduct](./CODE_OF_CONDUCT.md). To report a security problem, see the [security policy](./SECURITY.md).

Changes in each version are listed in the [changelog](./CHANGELOG.md).

## License

[MIT](./LICENSE)
