# Prava UI

Accessible, responsive React components that look finished the moment you install them. No Tailwind setup, no CSS-in-JS runtime, and no runtime dependencies.

[![npm version](https://img.shields.io/npm/v/@pravalabs/ui)](https://www.npmjs.com/package/@pravalabs/ui)
[![license: MIT](https://img.shields.io/npm/l/@pravalabs/ui)](./LICENSE)
[![CI](https://github.com/dineshdcshinde/prava-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/dineshdcshinde/prava-ui/actions/workflows/ci.yml)

> **Release candidate.** The API is close to final, but it can still change before `1.0.0`. Please try it and [report what you find](https://github.com/dineshdcshinde/prava-ui/issues).

## Why Prava UI

- **No design work.** Every component and state is already designed, in light and dark.
- **No build setup.** Styles are compiled and load automatically. You don't need Tailwind, PostCSS, or a CSS-in-JS runtime.
- **One provider for the whole app.** `PravaProvider` sets theme, direction, locale, and built-in text in one place.
- **Accessible by default.** Keyboard support, screen reader labels, and focus handling are part of each component.
- **Right-to-left ready.** Layouts mirror automatically for Arabic, Hebrew, and other RTL languages.
- **Fits any screen.** Components adapt to their container with no breakpoint props.
- **Easy to brand.** Change a few CSS variables and every component follows. Your CSS always wins.
- **Only what you import.** Each component brings its own JavaScript and CSS.

## Getting started

Prava UI works in any React 18.2+ or React 19 app, including Vite, Next.js, and Remix.

### 1. Install

The same package and command work for React and Next.js apps:

```sh
npm i @pravalabs/ui
```

pnpm and Yarn install it from the same npm registry:

```sh
pnpm add @pravalabs/ui
yarn add @pravalabs/ui
```

### 2. Wrap your app in `PravaProvider`

`PravaProvider` is where you configure Prava UI for your whole app. Add it once, with a `Toaster` for notifications, and every component inside follows it. With no props it uses the defaults: light theme, left-to-right, English.

**React (Vite):** `src/main.tsx`

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PravaProvider, Toaster } from "@pravalabs/ui";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PravaProvider>
      <App />
      <Toaster />
    </PravaProvider>
  </StrictMode>,
);
```

**Next.js (App Router):** `app/layout.tsx`

```tsx
import { PravaProvider, Toaster } from "@pravalabs/ui";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PravaProvider>
          {children}
          <Toaster />
        </PravaProvider>
      </body>
    </html>
  );
}
```

`layout.tsx` stays a Server Component. The package marks its own client code, so you don't need `"use client"` here.

### 3. Build your screens

Here's a complete team page built only from Prava UI components. Copy it into your app, and you can invite teammates, change roles, remove someone with Undo, and reach every control from the keyboard. The same file works in React and Next.js:

| App          | Save the file as        | Then render it                                 |
| ------------ | ----------------------- | ---------------------------------------------- |
| React (Vite) | `src/TeamPage.tsx`      | `<TeamPage />` in `src/App.tsx`                |
| Next.js      | `app/team/TeamPage.tsx` | from `app/team/page.tsx`, shown after the code |

```tsx
"use client"; // Needed by Next.js. Vite ignores it, so one file works in both.

import { useState, type FormEvent } from "react";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  Container,
  Dialog,
  DialogClose,
  DropdownMenu,
  Grid,
  Input,
  Progress,
  Select,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  dismissToast,
  toast,
} from "@pravalabs/ui";

type Member = { name: string; email: string; role: string };

const SEATS = 8;
const roles = [
  { value: "Admin", label: "Admin", description: "Manages billing and people" },
  {
    value: "Editor",
    label: "Editor",
    description: "Creates and edits projects",
  },
  { value: "Viewer", label: "Viewer", description: "Views and comments" },
];
const roleTone = {
  Admin: "primary",
  Editor: "info",
  Viewer: "neutral",
} as const;
const muted = { margin: 0, color: "var(--prava-color-text-muted)" };

export function TeamPage() {
  const [members, setMembers] = useState<Member[]>([
    { name: "Aisha Khan", email: "aisha@acme.dev", role: "Admin" },
    { name: "Mateo Rossi", email: "mateo@acme.dev", role: "Editor" },
    { name: "Mei Tanaka", email: "mei@acme.dev", role: "Viewer" },
  ]);
  const [invites, setInvites] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);
  const seatsUsed = members.length + invites.length;

  function sendInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email"));
    setInvites((list) => [...list, email]);
    setInviting(false);
    event.currentTarget.reset();
    toast({ title: "Invite sent", description: email, tone: "success" });
  }

  function setRole(member: Member, role: string) {
    setMembers((list) => list.map((m) => (m === member ? { ...m, role } : m)));
  }

  function remove(member: Member) {
    setMembers((list) => list.filter((m) => m !== member));
    const id = toast({
      title: `${member.name} was removed`,
      action: (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setMembers((list) => [...list, member]);
            dismissToast(id);
          }}
        >
          Undo
        </Button>
      ),
    });
  }

  return (
    <Container size="lg">
      <Stack gap={6}>
        <Stack
          orientation="horizontal"
          justify="between"
          align="center"
          gap={4}
          wrap
        >
          <div>
            <h1 style={{ margin: 0 }}>Team</h1>
            <p style={muted}>Choose who can see and edit your workspace.</p>
          </div>
          <Button
            onClick={() => setInviting(true)}
            disabled={seatsUsed >= SEATS}
          >
            Invite people
          </Button>
        </Stack>

        <Progress label="Seats used" value={seatsUsed} max={SEATS} showValue />

        <Tabs defaultValue="members">
          <TabList aria-label="Team">
            <Tab value="members">Members</Tab>
            <Tab value="invites">
              Pending{" "}
              {invites.length > 0 && (
                <Badge tone="primary" content={invites.length} />
              )}
            </Tab>
          </TabList>

          <TabPanel value="members">
            <Grid minColumnWidth="16rem" gap={4}>
              {members.map((member) => {
                const [firstName, lastName] = member.name.split(" ");
                return (
                  <Card key={member.email}>
                    <CardHeader>
                      <Stack orientation="horizontal" align="center" gap={3}>
                        <Avatar firstName={firstName} lastName={lastName} />
                        <div>
                          <strong>{member.name}</strong>
                          <p style={muted}>{member.email}</p>
                        </div>
                      </Stack>
                    </CardHeader>
                    <CardContent>
                      <Badge
                        tone={roleTone[member.role as keyof typeof roleTone]}
                        content={member.role}
                      />
                    </CardContent>
                    <CardFooter>
                      <DropdownMenu
                        trigger={
                          <Button variant="ghost" size="sm">
                            Manage
                          </Button>
                        }
                        items={[
                          {
                            label: "Change role",
                            items: roles.map((r) => ({
                              label: r.label,
                              disabled: r.value === member.role,
                              onSelect: () => setRole(member, r.value),
                            })),
                          },
                          { separator: true },
                          {
                            label: "Remove from team",
                            tone: "danger",
                            onSelect: () => remove(member),
                          },
                        ]}
                      />
                    </CardFooter>
                  </Card>
                );
              })}
            </Grid>
          </TabPanel>

          <TabPanel value="invites">
            {invites.length === 0 ? (
              <Alert title="No pending invites">
                People you invite show up here until they join.
              </Alert>
            ) : (
              <Stack gap={3}>
                {invites.map((email) => (
                  <Card key={email}>
                    <CardContent>
                      <Stack
                        orientation="horizontal"
                        justify="between"
                        align="center"
                        gap={3}
                      >
                        <span>{email}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setInvites((list) =>
                              list.filter((e) => e !== email),
                            )
                          }
                        >
                          Revoke
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </TabPanel>
        </Tabs>
      </Stack>

      <Dialog
        open={inviting}
        onOpenChange={setInviting}
        title="Invite a teammate"
        description="They get an email with a link to join."
        footer={
          <>
            <DialogClose>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" form="invite-form">
              Send invite
            </Button>
          </>
        }
      >
        <form id="invite-form" onSubmit={sendInvite}>
          <Stack gap={4}>
            <Input name="email" label="Work email" type="email" required />
            <Select
              name="role"
              label="Role"
              options={roles}
              defaultValue="Editor"
            />
          </Stack>
        </form>
      </Dialog>
    </Container>
  );
}
```

In Next.js, add the route file next to it. The route file stays a Server Component:

```tsx
// app/team/page.tsx
import { TeamPage } from "./TeamPage";

export default function Page() {
  return <TeamPage />;
}
```

None of this code handles styling, focus, ARIA, or validation, because the components do. The Dialog traps focus and returns it when it closes, the menu works with the arrow keys, and an invalid email shows a message. `PravaProvider` can switch the whole page to dark mode or right-to-left.

### Configure `PravaProvider`

Every prop is optional, so set only what you need:

```tsx
<PravaProvider
  theme="system" // "light" (default), "dark", or "system" to follow the OS
  direction="ltr" // "ltr" (default) or "rtl"
  locale="en" // sets `lang` and formats numbers in built-in text
  messages={{ required: "Required", close: "Close" }} // the library's own text
>
  <App />
</PravaProvider>
```

The provider applies to everything inside it and adds no layout of its own. You can nest providers to give one part of the page its own theme or language.

### Use your brand colors

Colors are CSS variables. Override them in your global stylesheet (`src/index.css`, or `app/globals.css` in Next.js), and every component updates:

```css
/* Light theme */
:root,
[data-prava-theme] {
  --prava-color-primary: #7c3aed;
  --prava-color-primary-hover: #6d28d9;
  --prava-color-primary-active: #5b21b6;
}

/* Dark theme, and "system" when the OS is dark */
[data-prava-theme="dark"] {
  --prava-color-primary: #a78bfa;
  --prava-color-primary-hover: #c4b5fd;
  --prava-color-primary-active: #8b5cf6;
}
@media (prefers-color-scheme: dark) {
  [data-prava-theme="system"] {
    --prava-color-primary: #a78bfa;
    --prava-color-primary-hover: #c4b5fd;
    --prava-color-primary-active: #8b5cf6;
  }
}
```

Prava UI's styles sit in a cascade layer, so your values win whatever the import order. [DESIGN.md](./DESIGN.md) lists every token, including surfaces, text, borders, status colors, radius, and shadows.

### Good to know

- **Fonts.** Components use your app's font. Prava UI never loads a font or adds global styles to your page.
- **Smaller imports.** You can import one component at a time, such as `import { Button } from "@pravalabs/ui/button"`.
- **Forms.** Form controls connect to [react-hook-form](https://react-hook-form.com/) through a `field` prop, with no extra dependency:

  ```tsx
  <Input
    label="Email"
    field={register("email")}
    error={errors.email?.message}
  />
  ```

- **Next.js.** You can use components directly in Server Components. Event handlers such as `onClick`, and calls to `toast()`, still belong in a Client Component, as with any React library.
- **Bundlers.** Styles load automatically with Vite, webpack, Rspack, Parcel, and Next.js. With Vite, webpack, and Next.js you get only the CSS for the components you use. esbuild writes the CSS to a separate `.css` file next to your bundle, which you link from your page. With esbuild and plain Rollup, importing from the package root includes CSS for every component, so import from component paths like `@pravalabs/ui/button` if CSS size matters. Parcel needs `"@parcel/resolver-default": { "packageExports": true }` in your `package.json` to resolve component paths.

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
| Setup      | `PravaProvider` (theme, direction, locale, and built-in text)                           |

## Documentation

Every component has live examples and an API reference in Storybook. A hosted version isn't available yet, so run it locally:

```sh
git clone https://github.com/dineshdcshinde/prava-ui.git
cd prava-ui
npm install
npm run dev
```

Your editor also shows the docs. Each prop and component has a description and an example inline.

## Theming

Light is the default. In React, use `PravaProvider`'s `theme` prop. Outside React, or in static markup, set the attribute on any element:

```html
<body data-prava-theme="dark">
  ...
</body>
<section data-prava-theme="system">...</section>
```

Every component also takes `className` and `style`, and compound ones take `classNames` for their inner parts. For brand colors, see [Use your brand colors](#use-your-brand-colors).

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
