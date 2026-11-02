import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Checkbox } from "../checkbox";
import { FormField } from "../form-field";
import { Input } from "../input";
import { PravaProvider } from "../provider";
import { RadioGroup } from "../radio-group";
import { Select } from "../select";
import { Switch } from "../switch";
import { Textarea } from "../textarea";

const submit = () => screen.getByRole("button", { name: "Save" }).click();

describe("shared field behavior", () => {
  it("renders description and error with aria links on every control", () => {
    render(
      <>
        <Input aria-label="A" description="Help A" error="Bad A" />
        <Textarea aria-label="B" description="Help B" error="Bad B" />
        <Select
          aria-label="C"
          description="Help C"
          error="Bad C"
          options={[{ value: "x", label: "x" }]}
        />
        <Checkbox label="D" description="Help D" error="Bad D" />
        <Switch label="E" description="Help E" error="Bad E" />
      </>,
    );
    for (const name of ["A", "B", "C", "D", "E"]) {
      const control =
        screen.queryByRole("textbox", { name }) ??
        screen.queryByRole("combobox", { name }) ??
        screen.queryByRole("checkbox", { name }) ??
        screen.getByRole("switch", { name });
      expect(control).toHaveAttribute("aria-invalid", "true");
      expect(control).toHaveAccessibleDescription(`Help ${name} Bad ${name}`);
    }
  });

  it("replaces browser bubbles with localized, number-formatted messages and focuses the first invalid control", async () => {
    render(
      <PravaProvider
        locale="ar-EG"
        messages={{
          valueMissing: "هذا الحقل مطلوب.",
          tooShort: "استخدم {minLength} أحرف على الأقل.",
        }}
      >
        <form>
          <Input aria-label="Name" required />
          <Input aria-label="Code" minLength={3} defaultValue="" />
          <button type="submit">Save</button>
        </form>
      </PravaProvider>,
    );
    submit();
    const name = screen.getByRole("textbox", { name: "Name" });
    expect(await screen.findByText("هذا الحقل مطلوب.")).toBeInTheDocument();
    expect(name).toHaveFocus();
    expect(name).toHaveAttribute("aria-invalid", "true");

    const user = userEvent.setup();
    await user.type(name, "Lina");
    expect(screen.queryByText("هذا الحقل مطلوب.")).toBeNull(); // clears as soon as it's valid
    const code = screen.getByRole("textbox", { name: "Code" });
    await user.type(code, "ab");
    await user.tab();
    expect(screen.getByText("استخدم ٣ أحرف على الأقل.")).toBeInTheDocument();
  });

  it("uses default English messages per constraint and the consumer's title for patterns", async () => {
    const user = userEvent.setup();
    render(
      <form>
        <Input aria-label="Email" type="email" />
        <Input aria-label="Zip" pattern="\d{5}" title="Use 5 digits." />
        <Select
          aria-label="Role"
          required
          placeholder="Choose"
          options={[{ value: "a", label: "A" }]}
        />
        <button type="submit">Save</button>
      </form>,
    );
    await user.type(screen.getByRole("textbox", { name: "Email" }), "nope");
    await user.type(screen.getByRole("textbox", { name: "Zip" }), "12");
    await user.tab();
    expect(
      screen.getByText("Enter a valid email address."),
    ).toBeInTheDocument();
    expect(screen.getByText("Use 5 digits.")).toBeInTheDocument();
    submit();
    expect(await screen.findByText("Select an option.")).toBeInTheDocument();
  });

  it("lets the error prop win and stays silent under noValidate", async () => {
    const user = userEvent.setup();
    render(
      <form noValidate>
        <Input aria-label="Email" type="email" error="From the app" />
        <Input aria-label="Other" type="email" />
        <button type="submit">Save</button>
      </form>,
    );
    await user.type(screen.getByRole("textbox", { name: "Other" }), "nope");
    await user.tab();
    expect(screen.queryByText("Enter a valid email address.")).toBeNull();
    expect(screen.getByText("From the app")).toBeInTheDocument();
  });

  it("shows FormField native messages once, in the field, for native and Prava controls", async () => {
    render(
      <form>
        <FormField label="Name" required control={<Input />} />
        <FormField label="Plain" required control={<input />} />
        <button type="submit">Save</button>
      </form>,
    );
    submit();
    expect(await screen.findAllByText("Fill in this field.")).toHaveLength(2);
  });

  it("groups radios with a legend, shared name, required cue, and group error", async () => {
    const user = userEvent.setup();
    let picked = "";
    render(
      <form>
        <RadioGroup
          label="Plan"
          required
          description="Change it anytime."
          onValueChange={(v) => (picked = v)}
          options={[
            { value: "free", label: "Free" },
            { value: "pro", label: "Pro" },
          ]}
        />
        <button type="submit">Save</button>
      </form>,
    );
    const group = screen.getByRole("radiogroup", { name: "Plan Required" });
    submit();
    expect(await screen.findByText("Select an option.")).toBeInTheDocument();
    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(group).toHaveAccessibleDescription(
      "Change it anytime. Select an option.",
    );
    await user.click(screen.getByRole("radio", { name: "Pro" }));
    expect(picked).toBe("pro");
    expect(screen.getByRole("radio", { name: "Free" })).toHaveAttribute(
      "name",
      screen.getByRole("radio", { name: "Pro" }).getAttribute("name")!,
    );
  });

  it("exposes checkbox mixed state and switch role", () => {
    render(
      <>
        <Checkbox label="All" indeterminate />
        <Switch label="Alerts" defaultChecked />
      </>,
    );
    expect(
      (screen.getByRole("checkbox", { name: "All" }) as HTMLInputElement)
        .indeterminate,
    ).toBe(true);
    expect(screen.getByRole("switch", { name: "Alerts" })).toBeChecked();
  });
});
