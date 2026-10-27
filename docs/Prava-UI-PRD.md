# Prava UI — Product Requirements Document (PRD)

**Document status:** V1 product and engineering baseline  
**Working product name:** Prava UI (temporary; may be renamed before public release)  
**Package name in scaffold:** `prava-ui` (temporary; availability and branding are not verified)  
**Product type:** Open-source React component library and design system  
**Target release:** V1  
**Decision rule:** This document is the product source of truth. An implementation must not silently contradict it.
**Purpose:** This is the PRD and owner-led execution guide, not a generated scaffold. The project owner will create the repository and tooling manually or delegate the scaffold as a separate, bounded task.

---

## 1. Executive summary

Prava UI is a lightweight, accessible, responsive, customizable React component library built with TypeScript and Tailwind CSS v4 as the internal styling authoring system. It will ship compiled CSS so consumers do not need to install, configure, or run Tailwind to use the library. The package will publish tree-shakable JavaScript exports, TypeScript declarations, design tokens, documentation, and examples.

V1 targets **25 core UI components plus 3 layout primitives** (`Container`, `Stack`, and `Grid`) to support responsive composition. That is **28 public building blocks in total**. Every component must pass its relevant functional, accessibility, responsive, localization, type, packaging, and documentation quality gates before V1 is considered complete. The count is a target; quality gates cannot be waived to ship a component faster.

The brand name is provisional. Implementation decisions must not rely on the name being permanent. The package name, CSS custom-property prefix, docs branding, and release metadata must be easy to rename together before first public release.

## 2. Product vision

### Vision

Help React developers build polished, accessible, responsive interfaces with good defaults and without fighting the component library.

### Product promise

> **Adaptive by default. Accessible by design. Lightweight in production. Yours to customize.**

### Primary audience

- React developers building production web applications.
- Product teams that need consistent UI primitives without adopting a large opinionated framework.
- Developers who use Vite, Next.js, and similar React toolchains.
- Developers who want well-documented components, predictable TypeScript APIs, customizable styles, and small runtime dependencies.

### Problems to solve

1. Teams repeatedly rebuild common controls and interaction states.
2. Some component libraries impose their visual system or styling configuration on consumers.
3. Custom styling can become brittle when component internals are opaque.
4. Responsive behavior, accessibility, and localization are often added late.
5. Developers need to understand component behavior quickly through examples, stories, and API documentation.

## 3. Goals and non-goals

### V1 goals

- Provide 25 core UI components and 3 responsive layout primitives.
- Support React `>=18.2.0 <20.0.0`, specifically React 18.2+ and React 19.
- Author styles with the current stable Tailwind CSS v4 line and ship compiled CSS.
- Require no Tailwind configuration in consumer applications.
- Provide ESM exports, CommonJS compatibility where feasible, TypeScript declarations, and documented import paths.
- Keep React and React DOM external peer dependencies.
- Make JavaScript tree-shaking verifiable in a consuming application.
- Provide sensible responsive defaults without requiring consumers to pass breakpoint-specific props.
- Allow developers to override styling using `className`, `style`, CSS custom properties, and component slot classes where appropriate.
- Include framework-neutral localization and LTR/RTL-ready behavior from the beginning.
- Establish Storybook, Vitest, React Testing Library, and Playwright workflows.
- Publish useful, accessible documentation and a repeatable release process.

### Non-goals for V1

- Recreating Material UI, Apple system UI, Vercel Geist, or another design system pixel-for-pixel.
- Shipping a complete page/template marketplace or paid tier.
- Bundling Lingui, i18next, or another translation framework as a mandatory dependency.
- Supporting React versions before 18.2 or promising React 20 compatibility before testing it.
- Providing a custom date picker, autocomplete/combobox, command palette, data table, rich-text editor, or charting system in V1.
- Claiming that unused CSS is tree-shaken merely because JavaScript exports are tree-shakable.
- Requiring consumers to configure Tailwind to generate the library's own component styles.
- Making every component full-width or forcing every control to change size at fixed device breakpoints.

## 4. Design inspirations and anti-hallucination guardrails

Prava UI will combine **principles**, not copy another product's visual design. The following sources are reference material, not a specification for reproducing their exact appearance.

### 4.1 Inspiration sources

1. **Google Material Design** — learn from consistent tokens, adaptive layouts, predictable states, and reusable component behavior. Reference: <https://m3.material.io/>
2. **Apple Human Interface Guidelines** — learn from clarity, visual hierarchy, purposeful spacing, intuitive controls, and restrained motion. Reference: <https://developer.apple.com/design/human-interface-guidelines/>
3. **Vercel Geist / developer-tool interfaces** — learn from crisp typography, restrained surfaces, useful information density, clear feedback, and technical precision. Reference: <https://vercel.com/geist>

These sources do not authorize copying logos, icons, source code, exact component appearance, proprietary assets, or a reference system's exact token values. New Prava UI tokens, names, component APIs, and visual details must be created and documented for this product.

### 4.2 Six Prava UI design principles

1. **Clarity before decoration.** Every color, border, shadow, spacing choice, and animation must communicate hierarchy or improve usability. Avoid decoration without a purpose.
2. **Adaptive by default.** Components should respond to their containing space and viewport where appropriate, without requiring consumers to configure breakpoints. Preserve content, usability, and intent rather than arbitrarily resizing controls.
3. **Delight without distraction.** Use restrained, meaningful interaction feedback and motion. Respect `prefers-reduced-motion`. Animation must not block interaction or conceal state changes.
4. **Customizable by design.** Provide strong defaults without trapping users. Expose stable styling hooks and documented props instead of requiring consumers to fork component internals.
5. **Accessible for everyone.** Semantic HTML, keyboard operation, visible focus, accessible naming, state announcements, contrast, reduced motion, localization, and RTL are engineering requirements—not optional enhancements.
6. **Lightweight by default.** Keep runtime dependencies minimal, export components in a tree-shakable way, avoid eager registries, and validate the built package instead of relying on source-only assumptions.

### 4.3 Prava UI visual direction

Prava UI should feel like a polished, dependable SaaS interface with a restrained contemporary edge. It should be approachable to a broad audience without relying on generational stereotypes or short-lived visual trends. The goal is for consumers to get a cohesive, professional interface from sensible defaults without needing to design every component themselves.

- Build personality through consistent details: a purposeful accent, clear hierarchy, considered spacing, surface and border contrast, and precise interaction feedback. Avoid decoration that does not help users understand or act.
- Use readable typography that inherits the consumer's font. Keep size and weight hierarchy clear without imposing a branded typeface.
- Use shape and density intentionally. Controls should feel comfortable and composed; reserve highly rounded treatments for components whose meaning benefits from them. Keep layouts useful in both compact product interfaces and spacious compositions.
- Use brief hover, pressed, focus, loading, and state feedback where it improves understanding. Motion should feel responsive and restrained, never delay input, and respect `prefers-reduced-motion`.
- Keep default styling complete and coherent while preserving the documented customization hooks. The library should provide a strong starting point, not force a brand onto the consumer's product.
- Keep components responsive and lightweight. Visual polish must not add avoidable runtime work, layout shifts, or interaction lag.

### 4.4 AI implementation instructions

When an AI coding agent implements a component, it must:

- Read `AGENTS.md` and this PRD before making changes.
- Use the six Prava UI principles as the authoritative design direction.
- Treat Material, Apple, and Geist references as conceptual inspiration only. Do not invent undocumented guidance and attribute it to those systems.
- Never copy reference-system tokens, exact visual treatments, brands, icons, or assets.
- Never invent a prop, state, keyboard shortcut, accessibility guarantee, supported browser, or compatibility claim. Propose a change to this PRD/API contract before implementing a behavior outside the documented contract.
- Do not create Tailwind classes dynamically with string interpolation. Use statically detectable classes, explicit variant maps, or CSS variables/data attributes so the compiled package contains the intended styles.
- Keep visual decisions consistent across components; use the established tokens rather than creating component-specific colors or spacing values ad hoc.
- Implement only the component or change requested in the current task. Do not generate the remaining component catalog in one pass.
- Add the component story, tests, and API documentation for the component currently being implemented.
- Explicitly report a requirement that cannot be satisfied or tested. Do not silently omit it.

### 4.5 Visual identity decisions not yet frozen

The exact accent hue, detailed palette, type scale, spacing scale, radii, shadows, and motion timings remain provisional until they are recorded in Foundations. Establish those decisions before broad component implementation, then review early components against them. Do not treat provisional scaffold token values as settled brand rules.

## 5. Design-system specification

### 5.1 Design tokens

The design system must define and document tokens for:

- Semantic colors: canvas, surface, elevated surface, primary text, secondary text, border, focus ring, primary action, success, warning, danger, and informational states.
- Typography: font sizes, line heights, font weights, and letter spacing. Components inherit `font-family` from their surrounding application by default; do not bundle, download, or impose a branded/default font. Optional typography customization may use stable, documented CSS custom properties.
- Spacing: a consistent scale used by components and layout primitives.
- Shape: control, card, overlay, and pill radii where justified.
- Elevation: limited, purposeful shadow levels.
- Motion: duration and easing tokens, plus reduced-motion behavior.
- Responsive behavior: documented breakpoints for layout cases that genuinely need them, not a requirement that each component change at every breakpoint.
- Focus: visible, high-contrast focus treatment.

CSS custom properties are the public theming contract. Their names must be centralized in the token files and documented. The implementation must not scatter raw brand values across component styles.

### 5.2 Themes

- Provide light and dark token values.
- Support a documented way to select a theme, preferably through a root attribute or provider-level setting.
- Respect an inherited theme when practical; do not cause a global style reset.
- Avoid flash or contradictory styles when consumers control the theme at the application root.
- The precise theme API must be finalized before the first component family relies on it.

### 5.3 CSS isolation and global behavior

- Ship compiled CSS generated from Tailwind CSS v4; consumers do not need to install Tailwind, scan the package, or configure a Tailwind plugin to get the default component styles.
- Publish a convenient aggregate stylesheet (`styles.css`) and granular component stylesheet entry points (`styles/components/<component>.css`) plus shared tokens. The build must verify that a consumer can include only the styles needed by selected components. If the chosen build pipeline cannot produce reliable granular styles, stop and document the trade-off rather than claiming CSS tree-shaking.
- Do not include Tailwind Preflight as an unavoidable package-wide reset. Do not modify unrelated page typography, global element margins, or application-wide layout.
- Do not set a font family on `html` or `body`, or introduce another unwanted global reset. Buttons, inputs, dialogs, menus, and all other components must use consistent consumer-controlled typography.
- Keep component styles and design tokens namespaced; avoid accidental global selector rules.
- Ensure CSS imports and `sideEffects` metadata are correct so a consumer's bundler does not accidentally discard required styles. JavaScript modules should remain tree-shakable; CSS files must be declared as side effects where required.
- Keep all Tailwind class names statically detectable at build time. Do not construct class names through string interpolation such as `bg-${tone}-500`; use explicit maps or component CSS variables/data attributes.
- Do not claim that importing one component removes unused CSS unless a packed consumer build proves it. JavaScript tree-shaking and CSS selection are tested separately.

### 5.4 Responsive behavior: automatic by default

Responsive behavior is the component library's responsibility. Consumers must not need to add responsive props just to make standard components fit mobile, tablet, and desktop layouts.

Implementation rules:

- Prefer normal document flow, flexible sizing, intrinsic sizing, `min-width: 0`, `max-width: 100%`, and CSS logical properties.
- Use container queries when the component's containing region is more relevant than the entire viewport.
- Use media queries for genuine viewport-driven layout changes.
- Avoid JavaScript viewport listeners for visual adjustments when CSS can handle the behavior.
- Do not force every component to become full-width on mobile. Default width must fit the component's purpose.
- Form controls (`Input`, `Textarea`, and `Select`) should fill the available parent width by default unless the composition explicitly calls for another intrinsic width.
- Buttons, badges, avatars, and compact controls should normally fit their content. A `fullWidth` option may be offered if there is a clear use case, but must not be required for responsiveness.
- Cards should fit the parent container and avoid fixed widths that cause overflow.
- Dialogs must remain within viewport-safe bounds, scroll appropriately, and use sensible maximum widths on larger viewports.
- Drawers, popovers, tooltips, and menus must avoid clipping off-screen and must preserve a usable interaction model at narrow widths.
- Layout primitives must enable content to adapt naturally without requiring consumers to manage breakpoints for common cases.
- Components may expose fixed size variants (`sm`, `md`, `lg`) where useful. The consumer can customize dimensions using `className`, `style`, CSS variables, or custom CSS.
- Do not introduce a universal API such as `size={{ base: ..., md: ... }}` unless real usage demonstrates that it is necessary. Responsive defaults come first; custom responsive styling remains the consumer's choice.
- Never use fixed pixel widths as the only layout strategy for components that must work in constrained containers.

### 5.5 Layout primitives

The following three layout primitives are included as V1 foundation exports in addition to the 25 core components:

- **Container:** centered content region with responsive padding and optional documented maximum-width variants.
- **Stack:** consistent vertical or horizontal flow, gap, alignment, and wrapping when applicable.
- **Grid:** responsive grid with sensible defaults and explicit options for columns and gaps when needed.

These primitives must not require the consumer to configure Tailwind. Their API should support composition, normal HTML attributes, and custom styling.

## 6. Public API conventions

### 6.1 General rules

- TypeScript-first APIs with exported prop types.
- Forward appropriate native HTML attributes and event handlers.
- Forward refs when the underlying DOM element or component semantics make this meaningful. Keep the chosen React 18/19 ref strategy consistent and tested.
- Use semantic HTML before creating custom ARIA widgets.
- Avoid `any` in public types.
- Use controlled and uncontrolled modes only when they provide a clear, documented benefit. Define precedence if both `value` and `defaultValue` are supplied.
- Use predictable names: `size`, `variant`, `disabled`, `invalid`, `className`, `style`, `classNames`, `defaultValue`, and `onValueChange` where appropriate.
- Don't expose internal implementation details as public props.
- Avoid a new prop for every style variation. Prefer a small, consistent variants API and documented CSS custom properties.

### 6.2 Styling API

- `className`: add consumer classes to the documented root slot.
- `style`: support React inline styles on the root DOM element where meaningful.
- CSS variables: support theme-level adjustment without replacing component internals.
- `classNames`: for compound components, optionally allow named slots such as `overlay`, `content`, `trigger`, `title`, or `close`.
- `data-*` attributes: expose stable state attributes when useful for custom CSS and tests.
- Document class-merging/precedence behavior. Do not promise that a conflicting utility class always wins unless the implementation and tests guarantee it.
- Styling hooks must not let custom styles remove essential focus indicators or break required interaction targets silently; developers remain responsible for their overrides, and documentation must explain the accessibility consequences.

### 6.3 Import API

The simplest consumer experience imports components from the package root. The ESM entry re-exports components through their style-bearing modules so a consumer bundler can include the selected components' compiled CSS:

```tsx
import { Button, Card, Input } from "prava-ui";
```

Consumers who want only selected component styles import a component entry point; its JavaScript automatically imports its compiled CSS and shared tokens:

```tsx
import { Button } from "prava-ui/button";
```

The root and component entry points include styles automatically. The aggregate and granular CSS exports remain available for CSS-only integration; manual granular CSS use includes shared `tokens.css` alongside the selected component stylesheet. Documentation must warn consumers not to combine manual CSS with JavaScript entry points unless intentional. Component JavaScript entry points must be documented and tested. The `exports` map must prevent imports from unsupported internal paths.

`className` accepts ordinary CSS classes and can also accept consumer utility classes when the consumer's own tooling generates them. Because this package ships compiled styles, it must not promise that consumer-provided Tailwind class names will work in a project that does not generate those utilities. CSS variables are the guaranteed theme-customization contract.

### 6.4 Editor-ready component guidance

- Add concise one-line TSDoc/JSDoc descriptions to every component-specific prop and public type so editors can explain the API inline; native React attributes keep their upstream React documentation.
- Add one copy-ready TypeScript/TSX usage example to each exported component's JSDoc using `@example`. Keep the example aligned with the component's Storybook default and documented API.
- Preserve JSDoc in generated declaration files and verify representative exported props and examples in the built package. Keep fuller behavior, accessibility, and customization guidance in component documentation; inline help complements it rather than replacing it.

## 7. Framework-neutral internationalization and RTL

Internationalization is a V1 requirement, but a translation framework is not.

- Do not require Lingui, i18next, or another translation library as a runtime dependency.
- Provide a typed internal-message contract for text owned by the library, including labels such as Close, Dismiss, Loading, Previous, and Next where those messages are relevant.
- Ship English defaults and allow consumers to override built-in messages.
- `PravaProvider` is the shared React Context configuration mechanism. Its V1 props are `direction?: "ltr" | "rtl"` (default `"ltr"`), `locale?: string` (active locale for built-in messages and relevant formatting), `messages?: Partial<BuiltInMessages>` (consumer overrides for library-owned labels/messages), and required `children: React.ReactNode`. `BuiltInMessages` denotes the typed internal-message contract; keep the contract framework-neutral. This API formalizes the provider direction already contemplated in this section; no conflicting provider API is documented.
- Components consume configuration through React Context or a suitable internal abstraction. Direction updates apply at runtime without a page reload. Provider configuration controls its own subtree by default and must not change host document direction implicitly; components outside it use the documented defaults (`ltr` and English messages) where practical.
- Put `dir={direction}` on the provider's appropriate subtree root. When an application intends to change the whole website, it may explicitly synchronize its document root, for example `<html dir={direction}>` in its own app-level layout; Prava UI does not do this implicitly. Locale and direction are independent.
- Use CSS logical properties (`margin-inline-start`, `padding-inline`, `inset-inline-end`, `text-align: start`, and related properties) rather than left/right assumptions when a logical property applies. Avoid hardcoded left/right positioning in those cases.
- Ensure icons, directional controls, overlays, menus, dialogs, and component layouts behave in both directions. Review directional icons individually; mirror only icons whose meaning or interaction requires it.
- Keep user-provided content untouched; do not translate a consumer's children.
- Document integration examples for consumers using their chosen localization library.
- Avoid date/time formatting APIs until a component needs them; when needed, use platform `Intl` APIs by default rather than adding a localization runtime.
- Storybook and documentation must include RTL examples for components where direction affects layout or interaction, including provider usage and explicit whole-document synchronization.
- Tests must cover provider defaults, subtree direction, runtime direction changes, locale/message behavior where implemented, and direction-sensitive interactions/layouts. Playwright must include at least one RTL smoke flow and verify overlay positioning at narrow widths.

## 8. Accessibility requirements

Target WCAG 2.2 AA as the baseline for relevant UI behavior, while documenting that compliance is assessed at product and integration level as well as per component. Follow WAI-ARIA Authoring Practices for applicable interaction patterns: <https://www.w3.org/WAI/ARIA/apg/>. Reference quick guidance: <https://www.w3.org/WAI/WCAG22/quickref/>.

Each component must meet the applicable requirements below:

- Correct semantic HTML and accessible name.
- Visible keyboard focus and logical tab order.
- Keyboard interaction matching the pattern's expected behavior.
- Correct disabled, selected, expanded, checked, busy, invalid, and other state exposure where applicable.
- Appropriate association between labels, descriptions, errors, and controls.
- Focus management and restoration for modal/overlay components.
- Escape and outside-click handling where appropriate and documented.
- Screen-reader announcements for async progress and notification behavior where appropriate.
- Touch targets and hit areas appropriate to the control and context.
- Sufficient contrast for text, important visual boundaries, and focus indicators.
- No color-only state communication.
- Reduced-motion support.
- No keyboard traps except when required by a recognized modal interaction pattern, with a clear escape route.

Automated axe checks are necessary but insufficient. Interactive widgets require keyboard tests and, where warranted, manual assistive-technology review before stable release.

## 9. V1 component catalog and requirements

The 25 core components below are the target catalog. The three layout primitives in Section 5.5 are additional public building blocks.

### 9.1 Everyday UI

#### 1. Button

- Purpose: trigger an action or submit a form.
- API: native button attributes, `variant`, `size`, `disabled`, optional loading state, `className`, and `style`.
- Variants: define a restrained semantic set (for example primary, secondary, outline, ghost, destructive) after Foundations are approved.
- Behavior: loading state communicates busy status and prevents duplicate submission if that is the documented behavior; icons must not replace the accessible name unless the button is explicitly icon-only.
- Responsive: fits content by default; can shrink/wrap or be explicitly widened by the consumer without overflow.
- A11y: native `<button>`, visible focus, disabled semantics, accessible icon-only labels.

#### 2. Badge

- Purpose: compact status/category indicator.
- API: semantic tone, size, visible content, and a child element the indicator is anchored to.
- Behavior: non-interactive by default; must not masquerade as a button.
- Responsive: content-sized, long labels wrap or truncate only when explicitly configured.
- A11y: status meaning cannot rely on color alone.

#### 3. Avatar

- Purpose: represent a person or entity.
- API: image source, accessible name, fallback content, size.
- Behavior: failed images display a deterministic fallback.
- Responsive: intrinsic, bounded size; must not stretch unexpectedly.
- A11y: meaningful image alt/name or decorative semantics when appropriate.

#### 4. Card

- Purpose: group related content.
- API: root attributes plus composable header/content/footer parts if justified.
- Behavior: no default click semantics unless explicitly made interactive.
- Responsive: fills its parent naturally; avoids fixed width assumptions.
- A11y: semantic structure and heading order remain consumer-controlled.

#### 5. Separator

- Purpose: separate content visually and semantically where appropriate.
- API: horizontal/vertical orientation.
- Behavior: decorative separator by default; semantic separator when it conveys structure.
- Responsive: orientation can be selected by layout or CSS; it must not create overflow.
- A11y: correct role and orientation when non-decorative.

#### 6. Spinner

- Purpose: indicate an ongoing process.
- API: size and optional accessible label.
- Behavior: animation respects reduced-motion preferences.
- Responsive: scales within its intended control/container.
- A11y: hidden decorative artwork plus an accessible status/label where appropriate; do not announce repeated noise.

#### 7. Skeleton

- Purpose: reserve space and indicate content loading.
- API: shape/size and optional composition classes.
- Behavior: avoid uncontrolled shimmer; support reduced motion.
- Responsive: parent-aware dimensions; should reduce layout shift when its intended content dimensions are known.
- A11y: mark decorative placeholders appropriately and avoid exposing meaningless shapes as content.

#### 8. Progress

- Purpose: communicate task progress.
- API: determinate value/min/max or documented indeterminate mode.
- Behavior: clamp/validate values consistently.
- Responsive: fills the available width by default.
- A11y: expose progress semantics and current values when determinate.

### 9.2 Forms and feedback

#### 9. Input

- Purpose: single-line user input.
- API: native input attributes, `size` variant, `invalid`, `disabled`, `className`, `style`.
- Behavior: support consumer-controlled values and standard browser input types; do not impose validation rules unexpectedly.
- Responsive: fills available parent width by default; consumer can set intrinsic or fixed width.
- A11y: label, description, and error associations are provided by FormField or consumer markup.

#### 10. Textarea

- Purpose: multiline user input.
- API: native textarea attributes, optional resize policy, rows, invalid state.
- Behavior: avoid automatic resizing unless explicitly enabled and accessible.
- Responsive: fills available width; content and resize behavior must not break small viewports.
- A11y: standard textarea labeling and error associations.

#### 11. Label

- Purpose: name a form control.
- API: native label attributes and required/optional presentation if needed.
- Behavior: preserve correct `htmlFor`/control association.
- Responsive: text wraps naturally.
- A11y: never rely on placeholder text as the sole label.

#### 12. FormField

- Purpose: compose a label, control, help text, and error message.
- API: stable IDs/association strategy and slots for label, description, control, and error content.
- Behavior: generate or accept IDs without collisions; associate descriptions/errors using `aria-describedby` where appropriate.
- Responsive: label/control flow must remain usable in narrow containers.
- A11y: error and help text are associated with the control; required state is conveyed correctly.

#### 13. Checkbox

- Purpose: binary or group selection; indeterminate state where supported.
- API: controlled/uncontrolled value, disabled, indeterminate if native semantics allow, label composition.
- Behavior: use native checkbox semantics where possible.
- Responsive: hit area and label wrapping remain usable.
- A11y: keyboard behavior and checked state follow native control behavior.

#### 14. RadioGroup

- Purpose: choose one option from a set.
- API: options/children, value/defaultValue, disabled, orientation where useful.
- Behavior: predictable arrow-key navigation and selection behavior.
- Responsive: options can wrap or stack where needed.
- A11y: proper group label and radio semantics.

#### 15. Switch

- Purpose: toggle a setting that takes effect immediately.
- API: checked/defaultChecked, disabled, accessible label and change callback.
- Behavior: use button/switch or native checkbox semantics consistently; do not use a switch for a multi-step action.
- Responsive: adequate hit area at narrow widths.
- A11y: correct role/state and Space-key interaction.

#### 16. Select

- Purpose: select one option from a list.
- V1 default: prefer native `<select>` unless a proven requirement justifies a custom listbox.
- API: native select attributes, options/children, invalid state.
- Behavior: preserve browser/platform accessibility; do not add custom keyboard logic to a native control.
- Responsive: fills available parent width and prevents text/arrow overflow.
- A11y: programmatic label and selected-value semantics.

#### 17. Alert

- Purpose: present contextual feedback or a message requiring attention.
- API: semantic tone and optional title/description/action.
- Behavior: informative by default; does not auto-dismiss unless explicitly designed to do so.
- Responsive: long text wraps; actions remain reachable on small screens.
- A11y: choose status/alert semantics according to urgency rather than applying assertive announcements to every alert.

### 9.3 Interaction components

#### 18. Dialog

- Purpose: present modal or non-modal content.
- API: controlled/uncontrolled open state, title/description/content slots, close callback, `classNames` for important slots.
- Behavior: focus placement, containment for modal dialogs, Escape handling, dismissal policy, scroll handling, and focus restoration must be specified and tested.
- Responsive: viewport-safe width/height and scroll; sensible maximum width on desktop.
- A11y: dialog naming, focus management, role/modal semantics, and dismissal behavior.

#### 19. Drawer

- Purpose: present side/bottom panel content.
- API: controlled/uncontrolled open state, placement, size constraints, content slots.
- Behavior: consistent overlay/dismissal/focus rules; only use a modal interaction when configured as modal.
- Responsive: adapt panel width/height to available viewport; placement and content must remain usable in RTL.
- A11y: correct dialog semantics when modal, focus handling, Escape behavior.

#### 20. Popover

- Purpose: show contextual floating content anchored to a trigger.
- API: open state, trigger/content composition, placement preference, dismissal callbacks.
- Behavior: positioning, collision handling, Escape, focus policy, outside-click behavior, and trigger relationship are documented.
- Responsive: prevent viewport overflow; placement may flip when necessary.
- A11y: interaction semantics depend on content; do not assign `role=menu` unless it is a menu.

#### 21. Tooltip

- Purpose: provide short supplementary information.
- API: trigger, content, optional delay and placement preference.
- Behavior: open on appropriate hover/focus interactions; remain dismissible; avoid interactive content.
- Responsive: avoid clipping and support touch contexts without making hover the only way to obtain information.
- A11y: link content to trigger where appropriate; ensure content is not the sole source of essential information.

#### 22. DropdownMenu

- Purpose: expose a list of actions related to a trigger.
- API: menu trigger, items, item disabled state, separators and optional submenus only if the complexity is justified.
- Behavior: arrow-key navigation, Home/End where specified, Escape, focus return, and disabled action handling.
- Responsive: collision-aware positioning and scroll handling.
- A11y: follow the WAI-ARIA menu button pattern; do not confuse action menus with listboxes.

#### 23. Tabs

- Purpose: switch between related panels within the same context.
- API: controlled/uncontrolled value, tab list, tabs, panels, activation mode if needed.
- Behavior: document automatic versus manual activation; keyboard navigation matches the chosen pattern.
- Responsive: tab labels can scroll or adapt without making controls unreachable.
- A11y: correct tablist/tab/tabpanel associations and selected state.

#### 24. Accordion

- Purpose: disclose and hide related content.
- API: single/multiple expansion, controlled/uncontrolled state, disabled items if needed.
- Behavior: predictable expansion and collapse; no hidden focusable content remains interactive.
- Responsive: content wraps and respects available width.
- A11y: button-based headings, expanded state, panel association.

#### 25. Toast

- Purpose: announce transient application feedback.
- API: title/description, status, duration, dismiss action, optional action when appropriate.
- Behavior: timer control and pause/dismiss rules must be documented; important errors must not disappear before users can perceive them.
- Responsive: container stays within viewport safe areas; long messages wrap and actions remain accessible.
- A11y: live region semantics appropriate to urgency, accessible dismissal, and no repeated intrusive announcements.

### 9.4 Layout primitives

#### Container

- Centers and constrains content when appropriate, applies responsive inline padding, and supports documented width variants or CSS variable overrides.
- Must not impose a max width where the consumer explicitly requests fluid width.

#### Stack

- Arranges children vertically or horizontally with consistent gaps and alignment.
- Supports wrapping where appropriate and preserves semantic children without unnecessary wrappers.

#### Grid

- Provides responsive columns/gaps using CSS Grid and intrinsic/minmax patterns.
- Defaults to a safe one-column layout when the available width is narrow; consumers may configure columns intentionally.
- Does not require consumer Tailwind configuration.

## 10. Package architecture and compatibility

### 10.1 Runtime and build

- React 19 is the development baseline.
- Peer dependency range: `react >=18.2.0 <20.0.0` and `react-dom >=18.2.0 <20.0.0`.
- React and React DOM must be externalized from published output.
- Use Vite library mode for builds.
- Use TypeScript to emit declarations.
- Ship ESM output and CommonJS output if verified by the actual build; ESM remains the preferred tree-shakable path.
- Provide an `exports` map for the root entry, supported component subpaths, aggregate CSS, shared tokens, and component-level CSS entry points.
- Mark CSS files as side effects where required so bundlers retain imported styles; keep component JavaScript modules free of unnecessary side effects and eligible for tree-shaking.
- Ship an aggregate `styles.css` compiled from Tailwind CSS v4 for easy onboarding, and shared-token plus per-component CSS files for consumers who need a smaller CSS payload. Consumers do not configure Tailwind for the library's default styles.
- Verify separately: (a) importing one component does not include other components' JavaScript, and (b) importing one component's granular stylesheet does not require every component's styles. Shared tokens are allowed.
- No component registry or top-level side effect may eagerly import every component.
- Inspect the generated CSS to ensure the library does not ship Tailwind Preflight or broad global reset rules unintentionally.

### 10.2 Runtime dependencies

- Keep runtime dependencies minimal.
- React and React DOM are peers, not bundled dependencies.
- Evaluate specialist overlay/positioning or class-merging dependencies against accessibility, package size, maintenance, and customization requirements. Do not adopt a dependency automatically, but do not reject a small, well-maintained dependency if it substantially reduces correctness risk.
- Any runtime dependency must have a documented justification in the architecture notes.

### 10.3 React compatibility matrix

- React 18.2.0: minimum supported target.
- Latest stable React 18 patch: supported target.
- Latest stable React 19: primary development and release target.
- Run type/build and consumer smoke tests for the supported matrix before stable release.
- Avoid APIs that only exist in React 19 unless compatibility is guarded and the benefit is documented.
- Do not claim React 20 support until it is tested and intentionally added to the peer range.

### 10.4 Responsive compatibility

The default package must work in Vite and be documented for Next.js and common React bundlers. CSS must not depend on runtime Tailwind compilation in the consuming app. Confirm SSR/hydration behavior for components that use portals, browser APIs, timers, or layout measurement.

## 11. Development and quality toolchain

### Storybook

- Use Storybook with its React/Vite integration.
- Every public component must have stories for default usage, variants, key states, responsive examples, custom styling, and RTL behavior where relevant.
- Use controls for supported props and autodocs/API descriptions where possible.
- Include a Foundation page documenting tokens, design principles, theming, responsive behavior, and accessibility expectations.
- Include the accessibility addon and fix actionable issues before release.

### Vitest and React Testing Library

- Vitest is the primary unit/integration test runner.
- React Testing Library and `user-event` are used for tests from the user's perspective.
- Unit tests cover props, controlled/uncontrolled behavior, callbacks, state, disabled/invalid cases, and small utilities.
- Avoid tests coupled to private implementation details.
- Coverage thresholds should be introduced as meaningful components are added; do not set misleading thresholds before the first component exists.

### Storybook story tests

- Use the supported Storybook Vitest integration for story rendering and interactions where it fits.
- Avoid duplicating every assertion in both Vitest and Playwright.
- Storybook is the primary visual and example surface; automated accessibility tests are a baseline, not proof of complete accessibility.

### Playwright

- Use Playwright for real-browser smoke tests, viewport behavior, critical keyboard flows, overlay/focus behavior, CSS delivery, and built-package consumer integration.
- Run Chromium smoke tests on pull requests. Run Chromium, Firefox, and WebKit checks before stable releases or in a broader scheduled job.
- Test narrow mobile viewport behavior, desktop behavior, and RTL behavior where applicable.
- Before V1 release, at least one test must install or consume the packed package artifact rather than only importing source files.

### Quality gates for each component

A component is not complete until it has:

1. Public TypeScript prop types and a documented API.
2. A Storybook story showing default usage and important variants/states.
3. Unit/integration tests for behavior and edge cases.
4. Relevant automated accessibility assertions.
5. Keyboard/manual behavior review if interactive.
6. Responsive behavior checked at narrow and wide viewports.
7. RTL review if layout or direction can affect it.
8. Customization checked with `className`, `style`, and CSS variables/slots where applicable.
9. No unexpected globals or style leakage.
10. Verified inclusion in build exports and documentation.

## 12. Documentation and developer experience

The documentation must make component discovery enjoyable and useful rather than forcing developers to read source code. It should feel polished, responsive, and fast, but avoid decorative motion that distracts from learning. The initial public documentation surface can be Storybook with a designed welcome/foundations page; a separate marketing/docs site is a later decision, not a prerequisite for the first component.

The documentation must include:

- Quick start and installation.
- Peer dependency and React compatibility guidance.
- CSS import instructions.
- Component API reference and TypeScript examples.
- Examples for customization with `className`, `style`, CSS variables, and slots.
- Responsive behavior explanations: what adapts automatically and what consumers may customize.
- Theme/light-dark setup.
- Localization and RTL integration.
- `PravaProvider` configuration, defaults, subtree scope, and explicit whole-document direction synchronization.
- Consumer-controlled typography and any supported typography CSS custom properties.
- Accessibility notes and keyboard behavior for interactive components.
- Storybook links, contribution guide, versioning policy, and changelog.
- A live playground with controls, copyable code, light/dark preview, responsive viewport checks, and RTL examples where relevant.
- A clear indication of stable, experimental, and planned features; do not label a feature production-ready until its quality gates pass.
- Clear distinction between verified behavior and planned/future features.

Documentation should be understandable without reading the source code. Do not describe a feature as supported until it is implemented and tested.

## 13. Release engineering

- Use GitHub Actions for CI.
- Use a lockfile once dependencies have been installed in the development environment; commit it so CI and contributors resolve the same versions.
- Run format/lint/type checks, unit tests, build, Storybook build, package artifact checks, and required browser tests.
- Use Changesets or an equivalent deliberate version/changelog workflow.
- Use semantic versioning after the first stable release.
- Review `npm pack --dry-run` and inspect the packed artifact before publication.
- Verify public exports, TypeScript declarations, compiled CSS, peer dependencies, and absence of test/source-only files in the published package.
- Use a controlled npm publishing workflow and enable package provenance/2FA where available and appropriate.
- Do not publish from this scaffold until package-name availability, license, repository URL, README links, peer matrix, and all release quality gates are verified.
- License choice is a release blocker. MIT is a reasonable recommendation for a broadly reusable library, but the owner must approve the license before adding a license file or publishing.

## 14. Owner-led scaffold and implementation sequence

This is the order the project owner or a coding agent should follow. Scaffolding means setting up the development and release foundation; it does **not** mean generating all 25 components at once.

### 14.1 Before creating the repository

1. Create a repository using a temporary, easy-to-change name such as `prava-ui`. Do not assume the npm package name is available or that the brand is final.
2. Verify the intended npm package name and repository name before the first public release. Keep the package name, documentation branding, CSS token prefix, and metadata centralized so they can be renamed.
3. Choose a package manager. Recommended default: `pnpm` for deterministic installs and workspace-friendly tooling; npm is also acceptable if the owner prefers fewer tools. Publishing to the npm registry does not require using npm as the local package manager.
4. Choose and record a license before public release. Recommended default: MIT, subject to owner approval.
5. Install a currently supported Node.js LTS release and select mutually compatible stable versions of React, Vite, Tailwind CSS v4, Storybook, Vitest, and Playwright. Record exact resolved versions in the lockfile; do not copy unverified version numbers from an old prompt.

### 14.2 Scaffold the build and package first

1. Create a TypeScript React component-library project using Vite library mode, not a normal app-only template.
2. Configure the supported peer range for `react` and `react-dom` as `>=18.2.0 <20.0.0`. Keep React external to the published bundle.
3. Configure ESM-first output, declaration-file generation, explicit package `exports`, and supported root/component/CSS entry points. Add CommonJS only if it can be built and tested without weakening the ESM contract.
4. Configure Tailwind CSS v4 as an internal build dependency. Ensure its source scanning targets this repository's component source and generated styles, not the consuming application.
5. Establish CSS generation before building components. Provide the aggregate stylesheet, shared token stylesheet, and a repeatable strategy for component-level styles. Prove the strategy with a tiny placeholder before creating the catalog.
6. Ensure the package stylesheet does not include Tailwind Preflight or broad resets. Ensure `package.json` metadata preserves imported CSS while leaving JavaScript tree-shakable.
7. Create the package export map and verify the built output rather than assuming that source aliases or dev-server behavior will work after publishing.

### 14.3 Add quality tools and verify each independently

1. Configure Storybook using the React/Vite integration. Add a Foundations story/page for design principles, tokens, theme behavior, responsive behavior, localization, and RTL. Do not generate component stories for components that do not exist yet.
2. Configure Vitest, React Testing Library, and `user-event`. Add at least one smoke test for the build/tooling itself before adding the Button tests.
3. Configure the supported Storybook Vitest integration for story rendering and interaction checks, avoiding unnecessary duplication with unit tests.
4. Configure Playwright to run a minimal browser smoke test against a running example/consumer app. Start with Chromium; add Firefox and WebKit release checks once the core path works.
5. Create a consumer fixture that installs the packed tarball, not just source imports. Verify stylesheet loading, root exports, direct component imports, TypeScript declarations, and no dependency on consumer Tailwind configuration.
6. Add formatting, linting, type-checking, tests, library build, Storybook build, package inspection, and browser checks to CI. A workflow is not complete just because it passes inside the source repository.

### 14.4 Recommended initial repository structure

Adapt names where necessary, but keep responsibilities clear and component work local:

```text
prava-ui/
  .storybook/
  .github/workflows/
  src/
    components/
      button/
        button.tsx
        button.types.ts
        button.stories.tsx
        button.test.tsx
        index.ts
      # Add other component folders only as each is implemented.
    layout/
      # Container, Stack, Grid are added in their planned implementation step.
    provider/
      # Theme and localization contracts when implemented.
    internal/
      # Private utilities and shared primitives; not public exports by default.
    styles/
      tokens.css
      themes.css
      index.css
      components/
        # One stylesheet per implemented component.
    index.ts
  tests/
    e2e/
    package/
  examples/
    consumer-vite/
  PRD.md
  README.md
  AGENTS.md
  package.json
  tsconfig.json
  vite.config.ts
  vitest.config.ts
  playwright.config.ts
```

Do not create 25 empty component files merely to fill the tree. Add a component's source, types, story, tests, and styles when that component is being implemented.

### 14.5 Required development scripts

Use these names or equivalent consistent names in `package.json`:

- `dev`: run the development or documentation workflow.
- `build`: build library JavaScript, CSS, and declarations.
- `typecheck`: type-check source, stories, and tests where practical.
- `lint` and `format:check`: enforce code-quality conventions.
- `test` and `test:watch`: run Vitest.
- `storybook` and `storybook:build`: run and build Storybook.
- `test:e2e`: run Playwright checks.
- `test:package`: pack and test the distributable package in a consumer fixture.
- `release:check`: run the release-blocking validation suite.

Script names may differ if the chosen tooling requires it, but every capability above must exist before V1 release.

### 14.6 Scaffold completion gate

Do not begin component implementation until all of the following are true:

- [ ] Clean install works from the lockfile.
- [ ] Library build emits ESM and type declarations.
- [ ] Tailwind CSS v4 compiles into distributable CSS without consumer Tailwind setup.
- [ ] Aggregate and granular CSS output exist, and CSS selection behavior has been verified in a consumer fixture.
- [ ] The package does not unintentionally include Preflight or a global reset.
- [ ] Storybook runs and builds, with a Foundations page but no fake component implementations.
- [ ] Vitest runs at least one tooling smoke test.
- [ ] Playwright runs at least one real-browser smoke test.
- [ ] The packed package installs into an example consumer app.
- [ ] A short architecture note records any unresolved build trade-offs.

### 14.7 Implement one component at a time

After the scaffold gate passes, implement only the requested component. Start with **Button** because it establishes variants, sizing, class merging, native attributes, focus treatment, stories, tests, and package exports without introducing overlay complexity.

For each component, use this sequence:

1. Read this PRD and `AGENTS.md` before editing.
2. Confirm the public API and states needed for this component. Ask for a design/API decision only if the PRD leaves a materially important behavior unresolved; otherwise follow the documented defaults.
3. Implement the component and its styles only. Do not create or modify the other 24 component implementations.
4. Add prop types, stories, unit/interaction tests, and relevant accessibility checks.
5. Test default and customized styling, narrow and wide viewports, and RTL where applicable.
6. Run type-check, lint, unit tests, Storybook checks, build, and relevant browser tests.
7. Inspect the diff and bundle impact. Report what changed, which commands passed, which checks were not run, and any unresolved issue.
8. Mark the component complete only when its quality gate in Section 11 passes.

Suggested order: Button; Input/Label/FormField/Textarea/Select; Badge/Card/Separator/Avatar/Spinner/Skeleton/Progress/Alert; Checkbox/RadioGroup/Switch; Container/Stack/Grid; Dialog/Drawer; Popover/Tooltip/DropdownMenu; Tabs/Accordion; Toast. The owner can reorder a small related group, but implementation must stay incremental. Conduct a focused dependency/architecture spike before implementing complex overlays or menus.

## 15. V1 acceptance criteria

V1 is ready only when all conditions below are true:

- [ ] The working brand can be renamed without rewriting component internals.
- [ ] The 25 core components and three layout primitives are implemented and documented.
- [ ] React 18.2+ and React 19 compatibility is validated across the promised range.
- [ ] Tailwind CSS v4 is compiled into the distributed stylesheet.
- [ ] Consumer projects do not need Tailwind configuration for default styles.
- [ ] The package does not ship an unintended global CSS reset.
- [ ] ESM imports are tree-shakable in a real consumer build; importing one component does not pull in every component's JavaScript.
- [ ] Aggregate and granular compiled CSS entry points work in a real consumer build; selecting one component's stylesheet does not require all component styles, and shared tokens are documented.
- [ ] Type declarations and supported package exports resolve correctly.
- [ ] Every component passes its quality gates in Section 11.
- [ ] Responsive defaults are validated at representative narrow, medium, and wide viewports (including a 320 CSS-pixel-wide viewport); consumers can override dimensions.
- [ ] Light/dark tokens and documented theme selection work.
- [ ] Built-in messages can be localized without a mandatory translation framework.
- [ ] RTL behavior is checked for direction-sensitive components.
- [ ] Storybook builds and has meaningful stories for all public components.
- [ ] Vitest tests pass; Storybook interaction checks run for relevant stories.
- [ ] Playwright checks critical browser behavior and at least one packed-consumer path.
- [ ] Build, types, documentation, package contents, license, and release metadata are reviewed.
- [ ] No undocumented claims are made about accessibility compliance, browser support, or tree-shaking.

## 16. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Over-scoping 25 components | Use component quality gates and incremental implementation; do not rush the complex overlays. |
| CSS leaking into consumer applications | Avoid Preflight, scope styles, use namespaced tokens, and test in a blank consumer app. |
| False tree-shaking claims | Verify JavaScript and CSS selection independently using packed consumer builds; distinguish aggregate CSS from granular component styles. |
| React 18/19 incompatibility | Keep peer ranges explicit and test minimum/latest supported versions. |
| Inaccessible custom widgets | Prefer native controls; follow WAI-ARIA patterns; allow focused dependency spikes for overlays and menus. |
| Responsive overrides are hard to apply | Document class/style/slot/CSS-variable hooks and test customization. |
| Internationalization retrofit cost | Use logical CSS and framework-neutral message contracts from the start. |
| AI-generated design drift | Require `AGENTS.md` and this PRD as the source of truth; implement one component at a time. |
| Name collisions or forced rename | Keep the brand provisional; verify npm, repository, domain, and trademark considerations before public release. |

## 17. Decision log

| Decision | Status |
|---|---|
| Working name: Prava UI | Provisional; rename may happen before publication. |
| React support: 18.2+ and 19 | Approved direction; validate implementation. |
| Tailwind CSS v4; compiled CSS distributed | Approved. |
| JavaScript tree-shaking plus aggregate and granular component CSS | Required; must be verified by a packed consumer build. |
| Consumer does not configure Tailwind to use default styles | Approved. |
| 25 core components for V1 | Approved target. |
| Container, Stack, Grid as additional layout primitives | Included to support the agreed responsive design-system direction; total 28 public building blocks. |
| Storybook, Vitest, React Testing Library, Playwright | Approved. |
| Framework-neutral i18n, RTL support | Approved; `PravaProvider` uses `direction`, `locale`, optional `messages`, and required `children`, with documented defaults and subtree scope. |
| Responsive by default; consumer can customize dimensions | Approved. |
| Design inspiration: Material, Apple HIG, Geist principles | Approved as inspiration only; no visual copying. |
| Final accent palette/type/radius/motion values | Must be decided in Foundations before broad component implementation. |
| Public npm name and license | Must be verified/approved before first release. |
| Package manager | Not frozen; recommended default is pnpm, with npm also acceptable. |
| Icon policy | Not frozen; recommended default is no mandatory icon runtime dependency; accept consumer-provided icons through children/slots. |
| Typography | Components inherit the consumer font by default; do not bundle or impose a font. Optional typography customization uses documented CSS custom properties. |

## 18. Open questions and recommended defaults

These questions are intentionally recorded so the owner can make explicit decisions. They should not block the initial scaffold unless marked as a release blocker. The recommended defaults keep the first implementation focused.

| Question | Recommended default | When it must be decided |
|---|---|---|
| Is `prava-ui` available and suitable as the final npm name? | Treat Prava UI and `prava-ui` as temporary; verify npm, GitHub, domain, and trademark conflicts before public release. | Before publishing or promoting publicly. |
| Which license should the project use? | MIT, subject to owner approval. | Before public release and before adding the license file. |
| Should Container, Stack, and Grid ship alongside the 25 named components? | Yes, as three additional layout primitives; the total catalog is 25 core components plus 3 layout primitives. | Confirm before implementation reaches the layout phase. |
| Which package manager should be used? | pnpm for lockfile/workspace ergonomics; npm is fine if simplicity is preferred. | At scaffold creation. |
| Should the library bundle an icon set? | No mandatory icon library. Accept `ReactNode` icon slots/children; use a chosen icon set only in examples if needed. | Before Button and other icon-capable APIs are finalized. |
| Should the library bundle a font? | No. Components inherit the consumer's font; do not impose a system or branded font family. | Decided for V1; document optional typography CSS custom properties in Foundations. |
| How should dark mode be selected? | Support an explicit root attribute or provider option and respect inherited application theming; avoid manipulating `document` implicitly. | Before theme-dependent components are implemented. |
| What exact palette, type scale, radii, spacing, and motion tokens should we use? | Define a distinct Prava palette and tokens in Foundations; do not copy Material, Apple, or Geist values. | Before implementing more than Button. |
| Which overlay/positioning dependency should be used? | None until the Dialog/Popover/DropdownMenu spike compares native behavior, accessibility, package size, and maintenance. | Before complex overlay implementation. |
| Which browsers are officially supported? | Target maintained evergreen browsers; write an explicit support matrix before the first stable release. | Before V1 release. |
| Which docs hosting/marketing site should be used? | Use Storybook as the initial living component documentation; add a separate marketing/docs site only if it adds real value. | Before first public beta. |
| What is the bundle-size budget? | Measure Button and the overlay spike first, then set enforceable budgets for simple components, full JS, aggregate CSS, and per-component CSS. | After the first build spike and before many components are added. |
| Should components ship CommonJS as well as ESM? | ESM is mandatory; ship CommonJS only if consumer tests demonstrate a real need and the output stays correct. | During packaging spike. |
| Should class names merge Tailwind conflicts automatically? | Decide after testing `className` customization. Prefer a small, documented merge strategy; do not claim arbitrary overrides always win. | Before Button's public API is frozen. |

### Questions the owner should not leave implicit

- **Brand/name:** Is the project name temporary until the first public beta, or do you want to invest in branding now? Current plan: keep it temporary.
- **License:** Are you comfortable releasing under MIT? Current recommendation: yes, after owner approval.
- **Layout scope:** Do you want 25 components only, or 25 plus Container/Stack/Grid? Current plan: 25 plus three layout primitives.
- **Icons:** Do you want a built-in icon package? Current recommendation: no; keep icons consumer-supplied to reduce dependency weight and avoid locking developers into one icon style.
- **Documentation:** Is a separate website required for V1, or can Storybook be the initial docs experience? Current recommendation: Storybook first, with polished navigation and examples.

The PRD may be amended as these decisions are answered, but changes to public API, accessibility behavior, package exports, or styling contracts should be recorded before implementation rather than silently improvised by an AI agent.

## 19. Official references

The references below are used for technical verification and conceptual inspiration. They do not replace Prava UI's own specification.

- React versions: <https://react.dev/versions>
- Tailwind CSS updates: <https://tailwindcss.com/blog>
- Storybook React/Vite integration: <https://storybook.js.org/docs/get-started/frameworks/react-vite>
- Storybook installation: <https://storybook.js.org/docs/get-started/install>
- Vitest Browser Mode: <https://vitest.dev/guide/browser/>
- Playwright: <https://playwright.dev/docs/intro>
- Material Design 3: <https://m3.material.io/>
- Apple Human Interface Guidelines: <https://developer.apple.com/design/human-interface-guidelines/>
- Vercel Geist: <https://vercel.com/geist>
- WAI-ARIA Authoring Practices: <https://www.w3.org/WAI/ARIA/apg/>
- WCAG 2.2 Quick Reference: <https://www.w3.org/WAI/WCAG22/quickref/>
