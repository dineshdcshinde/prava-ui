# Changelog

Notable changes to Prava UI. This project follows [semantic versioning](https://semver.org/) from `1.0.0` onwards. Release candidates can still include breaking changes.

## Unreleased

## 1.0.0-rc.1

The first public release candidate.

### Added

- **Actions and display:** Button, Avatar, Badge, Card, Separator, Skeleton, Spinner, and Progress.
- **Forms:** Input, Textarea, Select, Checkbox, RadioGroup, Switch, Label, and FormField, with localized validation messages and a `field` prop for react-hook-form.
- **Feedback:** Alert, and Toaster with `toast()` and `dismissToast()`.
- **Overlays:** Dialog, Drawer, Popover, Tooltip, and DropdownMenu, built on the native `<dialog>` element and Popover API.
- **Navigation:** Tabs and Accordion.
- **Layout:** Container, Stack, and Grid.
- **Setup:** PravaProvider for direction, locale, messages, and theme.
- Light, dark, and system themes, driven by CSS tokens you can override.
- Right-to-left support, and automatic placement for Select's list, with a `placement` prop to choose a side.

### Known limits

- A `Toaster` outside an open modal Dialog shows above it, but can't be pressed or announced until the Dialog closes.
- The package ships ES modules only.
