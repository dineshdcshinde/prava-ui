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

  it("styles native text controls like Prava's and leaves other controls alone", () => {
    render(
      <>
        <FormField
          label="Site"
          control={<input type="url" className="own" />}
        />
        <FormField label="Note" control={<textarea data-size="lg" />} />
        <FormField label="Agree" control={<input type="checkbox" />} />
        <FormField label="Name" control={<Input />} />
      </>,
    );
    expect(screen.getByLabelText("Site")).toHaveClass("prava-control", "own");
    expect(screen.getByLabelText("Site")).toHaveAttribute("data-size", "md");
    expect(screen.getByLabelText("Note")).toHaveAttribute("data-size", "lg");
    expect(screen.getByLabelText("Agree")).not.toHaveClass("prava-control");
    expect(screen.getByLabelText("Name")).toHaveAttribute("data-size", "md");
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
