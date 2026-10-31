import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Input } from "./Input";

afterEach(cleanup);

describe("Input", () => {
  it("renders a labeled native input and forwards native attributes", () => {
    render(
      <>
        <label htmlFor="email">Email</label>
        <Input id="email" type="email" name="email" autoComplete="email" />
      </>,
    );
    const input = screen.getByRole("textbox", { name: "Email" });
    expect(input.getAttribute("type")).toBe("email");
    expect(input.getAttribute("name")).toBe("email");
    expect(input.getAttribute("autocomplete")).toBe("email");
  });

  it("forwards its ref to the native input", () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} aria-label="Search" />);
    expect(ref.current).toBe(screen.getByRole("textbox", { name: "Search" }));
  });

  it("supports decorative icons and native event handlers for form integrations", () => {
    const onChange = vi.fn();
    const onBlur = vi.fn();
    render(
      <Input
        label="Search"
        leftIcon={<svg data-testid="leading-icon" />}
        rightIcon={<svg data-testid="trailing-icon" />}
        onChange={onChange}
        onBlur={onBlur}
      />,
    );
    const input = screen.getByRole("textbox", { name: "Search" });
    expect(
      screen
        .getByTestId("leading-icon")
        .parentElement?.getAttribute("aria-hidden"),
    ).toBe("true");
    expect(
      screen
        .getByTestId("trailing-icon")
        .parentElement?.getAttribute("aria-hidden"),
    ).toBe("true");
    fireEvent.change(input, { target: { value: "term" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledOnce();
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("supports size variants, native numeric size, and invalid state", () => {
    const { rerender } = render(
      <Input aria-label="Search" size="lg" invalid />,
    );
    const input = screen.getByRole("textbox", { name: "Search" });
    expect(input.getAttribute("data-size")).toBe("lg");
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.hasAttribute("size")).toBe(false);

    rerender(<Input aria-label="Search" size={24} />);
    expect(
      screen.getByRole("textbox", { name: "Search" }).getAttribute("size"),
    ).toBe("24");
  });

  it("floats its associated label on focus and keeps it floated after typing", () => {
    render(<Input label="Email" type="email" />);
    const input = screen.getByRole("textbox", { name: "Email" });
    const label = screen.getByText("Email");
    expect(input.id).toBe(label.getAttribute("for"));
    expect(input.getAttribute("data-floated")).toBeNull();

    fireEvent.focus(input);
    expect(input.getAttribute("data-floated")).toBe("true");
    fireEvent.change(input, { target: { value: "a@example.com" } });
    fireEvent.blur(input);
    expect(input.getAttribute("data-floated")).toBe("true");
  });

  it("forwards className, style, and disabled state", () => {
    render(
      <Input
        aria-label="Search"
        className="custom"
        style={{ color: "red" }}
        disabled
      />,
    );
    const input = screen.getByRole("textbox", { name: "Search" });
    expect(input.className).toContain("custom");
    expect(input.getAttribute("style")).toContain("color: red");
    expect((input as HTMLInputElement).disabled).toBe(true);
  });

  it("shows and describes a reason only while disabled", () => {
    const { rerender } = render(
      <Input
        aria-label="Account name"
        aria-describedby="account-help"
        disabled
        disabledReason="Managed by your administrator."
      />,
    );
    const input = screen.getByRole("textbox", { name: "Account name" });
    const reason = screen.getByText("Managed by your administrator.");
    expect(input.getAttribute("aria-describedby")).toContain("account-help");
    expect(input.getAttribute("aria-describedby")).toContain(reason.id);

    rerender(
      <Input
        aria-label="Account name"
        aria-describedby="account-help"
        disabledReason="Managed by your administrator."
      />,
    );
    expect(screen.queryByText("Managed by your administrator.")).toBeNull();
    expect(
      screen
        .getByRole("textbox", { name: "Account name" })
        .getAttribute("aria-describedby"),
    ).toBe("account-help");
  });
});
