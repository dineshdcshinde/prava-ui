import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "../input";
import { Textarea } from "../textarea";
import { FormField } from "./FormField";

describe("FormField", () => {
  it("associates required state, description, error, and existing descriptions", () => {
    render(
      <FormField
        label="Email"
        required
        description="Use your work address."
        error="Enter a valid email."
        control={<Input type="email" aria-describedby="hint" />}
      />,
    );
    const input = screen.getByRole("textbox", { name: "Email Required" });
    expect(input).toHaveAttribute("aria-required", "true");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toContain("hint");
    expect(input.getAttribute("aria-describedby")).toContain(
      screen.getByText("Use your work address.").id,
    );
    expect(input.getAttribute("aria-describedby")).toContain(
      screen.getByText("Enter a valid email.").id,
    );
  });

  it("renders multiline controls with generated IDs", () => {
    render(
      <FormField
        label="Message"
        description="Keep it brief."
        control={<Textarea rows={4} />}
      />,
    );
    const control = screen.getByRole("textbox", { name: "Message" });
    expect(control.id).toBeTruthy();
    expect(control).toHaveAttribute("rows", "4");
    expect(control.getAttribute("aria-describedby")).toBeTruthy();
  });
});
