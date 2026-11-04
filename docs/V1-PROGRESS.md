# V1 Progress

**28 of 28 built.** Catalog from [PRD section 9](./Prava-UI-PRD.md#9-v1-component-catalog-and-requirements).

✅ means built and exported, with a story and tests. Final sign-off still needs the full [PRD section 11](./Prava-UI-PRD.md#quality-gates-for-each-component) quality gate.

| #   | Component    | Group       | Done |
| --- | ------------ | ----------- | ---- |
| 1   | Button       | Everyday    | ✅   |
| 2   | Badge        | Everyday    | ✅   |
| 3   | Avatar       | Everyday    | ✅   |
| 4   | Card         | Everyday    | ✅   |
| 5   | Separator    | Everyday    | ✅   |
| 6   | Spinner      | Everyday    | ✅   |
| 7   | Skeleton     | Everyday    | ✅   |
| 8   | Progress     | Everyday    | ✅   |
| 9   | Input        | Forms       | ✅   |
| 10  | Textarea     | Forms       | ✅   |
| 11  | Label        | Forms       | ✅   |
| 12  | FormField    | Forms       | ✅   |
| 13  | Checkbox     | Forms       | ✅   |
| 14  | RadioGroup   | Forms       | ✅   |
| 15  | Switch       | Forms       | ✅   |
| 16  | Select       | Forms       | ✅   |
| 17  | Alert        | Forms       | ✅   |
| 18  | Dialog       | Interaction | ✅   |
| 19  | Drawer       | Interaction | ✅   |
| 20  | Popover      | Interaction | ✅   |
| 21  | Tooltip      | Interaction | ✅   |
| 22  | DropdownMenu | Interaction | ✅   |
| 23  | Tabs         | Interaction | ✅   |
| 24  | Accordion    | Interaction | ✅   |
| 25  | Toast        | Interaction | ✅   |
| 26  | Container    | Layout      | ✅   |
| 27  | Stack        | Layout      | ✅   |
| 28  | Grid         | Layout      | ✅   |

Browser tests run in Chromium, Firefox, and WebKit, and cover overlays, focus, RTL, reduced motion, and 320px layouts; emulated phones cover touch (`npm run test:e2e:all`). Still open for V1 sign-off: the React 18.2 consumer check, a manual screen reader pass on the interactive components, and a check on real touch devices.
