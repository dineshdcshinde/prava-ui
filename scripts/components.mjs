// Single registry: build entries, per-component CSS, and package checks all read this list.
export const components = [
  ["button", "Button"],
  ["badge", "Badge"],
  ["avatar", "Avatar"],
  ["spinner", "Spinner"],
  ["input", "Input"],
  ["card", "Card"],
  ["separator", "Separator"],
  ["skeleton", "Skeleton"],
  ["progress", "Progress"],
  ["textarea", "Textarea"],
  ["label", "Label"],
  ["form-field", "FormField"],
  ["checkbox", "Checkbox"],
  ["switch", "Switch"],
  ["radio-group", "RadioGroup"],
  ["select", "Select"],
  ["alert", "Alert"],
  ["container", "Container"],
  ["stack", "Stack"],
  ["grid", "Grid"],
  ["dialog", "Dialog"],
  ["drawer", "Drawer"],
  ["popover", "Popover"],
  ["tooltip", "Tooltip"],
  ["dropdown-menu", "DropdownMenu"],
  ["tabs", "Tabs"],
  ["accordion", "Accordion"],
  ["toast", "Toaster"],
  ["provider", "PravaProvider"],
].map(([name, component]) => ({ name, component }));

// Controls that render labels, descriptions, or errors also load the shared field stylesheet.
export const fieldControls = new Set([
  "input",
  "textarea",
  "form-field",
  "label",
  "checkbox",
  "switch",
  "radio-group",
  "select",
]);

// Anchored popups also load the shared floating stylesheet.
export const floatingControls = new Set([
  "popover",
  "tooltip",
  "dropdown-menu",
]);

// The chunk holding a component's code: its styles live there, since bundlers skip the re-export entry.
export const componentChunk = (entryCode, name) => {
  const chunks = [...entryCode.matchAll(/from "\.\/([^"]+\.js)"/g)].map(
    ([, chunk]) => chunk,
  );
  if (chunks.length !== 1)
    throw new Error(
      `dist/${name}.js must re-export exactly one chunk to carry its styles, found: ${chunks.join(", ") || "none"}.`,
    );
  return chunks[0];
};
