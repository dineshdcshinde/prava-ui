# How to publish Prava UI to npm

This guide assumes you've never published a package. Every command runs from a terminal in `c:\prava-ui` unless a step says otherwise. Allow about an hour the first time; most of that is step 5.

## Three things to know first

1. **A published version is permanent.** You can never publish `1.0.0-rc.1` twice, even after deleting it. If something's wrong, you publish `1.0.0-rc.2`. That's normal, and it's why release candidates exist.
2. **Tags decide what people install.** `npm install @prava-ui/react@next` gets whatever the `next` tag points to. This guide always passes `--tag next` for release candidates. `package.json` also sets `"publishConfig": { "tag": "next" }` as a backup.
3. **Everything in the package is public forever.** Step 4 shows you exactly what goes out, so you can check before it does.

## 1. Save your work to GitHub

```powershell
git status
git add -A
git commit -m "feat: complete V1 catalog and prepare 1.0.0-rc.1"
git push
```

Read the `git status` list before you add. Nothing secret should be in it, such as `.env` files or keys.

## 2. Set up your npm account (once only)

1. Sign up at <https://www.npmjs.com/signup> and verify your email.
2. Turn on two-factor authentication: click your profile picture, then **Account**, then **Enable 2FA**. Choose the option for **authorization and writes**, and save your recovery codes somewhere safe.
3. Log in from the terminal, then check it worked:

   ```powershell
   npm login
   npm whoami
   ```

   `npm whoami` should print your npm username.

4. Create the `prava-ui` organization (free, public packages): click your profile picture, then **Add Organization**, and name it `prava-ui`. Only its members can publish under `@prava-ui/`, which also reserves names like `@prava-ui/next` for later.

## 3. Run the final checks

Run these one at a time. Each should finish without errors:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run test:package
npm run test:e2e
```

Skip `npm run release:check` and `npm run format:check` for this release. They report formatting problems for files with Windows line endings and for tool folders, which don't affect the package.

If `test:e2e` fails on its first one or two tests, run it again. Storybook can be slow to start the first time.

## 4. Look at exactly what will be published

```powershell
npm pack --dry-run
```

Check that:

- `name` is `@prava-ui/react` and `version` is `1.0.0-rc.1`.
- The list has `README.md`, `LICENSE`, `package.json`, and the `dist/` files, including `dist/dialog.js` and `dist/toast.js`.
- There's no `src/`, `.env`, or anything private.

Type files for stories and tests in `dist/` are expected for now. They're harmless, and removing them is a later task.

## 5. Try it in a real app with React 18.2

This is the most valuable step, because it's what your first users will experience. Create the package file outside the repo:

```powershell
npm pack --pack-destination ..
```

Create a test app next to the repo, on React 18.2:

```powershell
cd ..
npm create vite@latest prava-test -- --template react-ts
cd prava-test
npm install
npm install react@18.2.0 react-dom@18.2.0
npm install -D @types/react@18 @types/react-dom@18
npm install ..\prava-ui-react-1.0.0-rc.1.tgz
```

Replace everything in `src/App.tsx` with this:

```tsx
import {
  Accordion,
  AccordionItem,
  Button,
  Dialog,
  DialogClose,
  DropdownMenu,
  Input,
  Select,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Toaster,
  toast,
  Tooltip,
} from "@prava-ui/react";

export default function App() {
  return (
    <main
      style={{
        display: "grid",
        gap: "1.5rem",
        padding: "2rem",
        maxWidth: "32rem",
      }}
    >
      <Toaster />
      <Input label="Your name" />
      <Select
        label="Role"
        placeholder="Choose a role"
        options={[
          { value: "admin", label: "Admin" },
          { value: "member", label: "Member" },
        ]}
      />
      <Dialog
        trigger={<Button>Open dialog</Button>}
        title="It works"
        footer={
          <DialogClose>
            <Button>Close</Button>
          </DialogClose>
        }
      >
        Press Escape or use the buttons to close.
      </Dialog>
      <DropdownMenu
        trigger={<Button variant="outline">Open menu</Button>}
        items={[
          {
            label: "Show a toast",
            onSelect: () => toast({ title: "Hello", tone: "success" }),
          },
        ]}
      />
      <Tooltip content="Tooltip text">
        <Button variant="ghost">Hover me</Button>
      </Tooltip>
      <Tabs defaultValue="one">
        <TabList aria-label="Example">
          <Tab value="one">One</Tab>
          <Tab value="two">Two</Tab>
        </TabList>
        <TabPanel value="one">First panel</TabPanel>
        <TabPanel value="two">Second panel</TabPanel>
      </Tabs>
      <Accordion>
        <AccordionItem value="a" title="Open me">
          Hidden content
        </AccordionItem>
      </Accordion>
    </main>
  );
}
```

Then run it:

```powershell
npm run dev
```

Open the address it prints, and check:

- [ ] `npm ls react` shows `18.2.0`, and the browser console shows no errors.
- [ ] Everything is styled, with no extra CSS import or Tailwind setup.
- [ ] The dialog opens, Escape closes it, and focus returns to the button.
- [ ] The menu works with the arrow keys and shows a toast.
- [ ] The tooltip, tabs, and accordion all respond.

Finally, confirm a production build works, then go back to the repo:

```powershell
npm run build
cd ..\prava-ui
```

**If anything's wrong, stop here and fix it.** Nothing has been published yet, so this costs nothing.

## 6. Publish

Do a rehearsal first. It runs everything except the upload, including a fresh build and package check:

```powershell
npm publish --dry-run --tag next
```

Check that the end of the output says `with tag next` and `+ @prava-ui/react@1.0.0-rc.1`. Then publish for real:

```powershell
npm publish --tag next
```

It will ask for your two-factor code, or open a browser to confirm. Success looks like this:

```text
+ @prava-ui/react@1.0.0-rc.1
```

## 7. Check it as a stranger would

```powershell
npm view @prava-ui/react dist-tags
```

You should see `next: '1.0.0-rc.1'`. You'll probably see `latest` pointing to it too, because npm requires a package's first version to be `latest`. That's fine: it means a plain `npm install @prava-ui/react` also gets the RC until `1.0.0` is out, and the README's RC notice covers this.

Then look at <https://www.npmjs.com/package/@prava-ui/react>, and in your test app:

```powershell
cd ..\prava-test
npm install @prava-ui/react@next
npm run dev
cd ..\prava-ui
```

The npm page and the README's version badge can take a few minutes to update.

## 8. Mark the release on GitHub

```powershell
git tag v1.0.0-rc.1
git push origin v1.0.0-rc.1
```

On GitHub, go to **Releases**, then **Draft a new release**. Pick the `v1.0.0-rc.1` tag, paste the matching section of `CHANGELOG.md`, tick **Set as a pre-release**, and publish.

## 9. Finish the GitHub repo page

- **Sidebar:** click the gear next to **About**. Add a description and topics such as `react`, `component-library`, `accessibility`, `rtl`, and `typescript`.
- **Security reports:** in **Settings**, then **Advanced Security**, turn on **Private vulnerability reporting**. `SECURITY.md` relies on it.
- **Contact details:** `CODE_OF_CONDUCT.md` tells people to use the contact details on your GitHub profile, so make sure your profile has some.
- **Checklist:** **Insights**, then **Community Standards**, shows which community files GitHub found.

## If something goes wrong

| Problem                        | What to do                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------- |
| `403` or "cannot publish over" | That version already exists. Bump the version (below).                                          |
| `E403` mentioning 2FA          | Finish turning on two-factor authentication in step 2.                                          |
| `ENEEDAUTH`                    | Run `npm login`.                                                                                |
| `E404` on publish              | The `prava-ui` organization doesn't exist or you aren't a member. See step 2.                   |
| "Package name too similar"     | npm rejected the name. Stop and choose another name.                                            |
| A bug in a published version   | Fix it and publish the next RC.                                                                 |
| A seriously broken version     | Publish a fix, then warn people: `npm deprecate @prava-ui/react@1.0.0-rc.1 "Broken, use rc.2"`. |
| Published a secret by accident | Change that secret immediately, because it's already public. Then unpublish.                    |

Avoid `npm unpublish`. It only works within a limited window, the version number stays used forever, and it can break anyone already using it.

## Publishing the next release candidate

1. Add your changes to `CHANGELOG.md`, under a new `1.0.0-rc.2` heading.
2. Commit them, then run:

   ```powershell
   npm version 1.0.0-rc.2
   git push --follow-tags
   npm publish --tag next
   ```

   `npm version` updates `package.json`, commits it, and creates the git tag.

## Publishing the final 1.0.0

Before calling it stable, finish what's listed as open in [V1-PROGRESS.md](./V1-PROGRESS.md), then:

1. Remove the `publishConfig` block from `package.json`, so the release goes to `latest`.
2. Remove the release candidate notice from the README, and change its install command to `npm install @prava-ui/react`.
3. Run `npm version 1.0.0`, push with `git push --follow-tags`, then run `npm publish`.
