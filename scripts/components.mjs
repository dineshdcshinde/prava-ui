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
