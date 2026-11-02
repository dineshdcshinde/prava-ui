import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

const PlusIcon = () => <svg data-testid="plus-icon" />;

describe("Button", () => {
  it("renders decorative start and end icons around the label", () => {
    render(
      <Button startIcon={<PlusIcon />} endIcon={<PlusIcon />}>
        Add item
      </Button>,
    );
    expect(screen.getByRole("button", { name: "Add item" })).toHaveAttribute(
      "type",
      "button",
    );
    expect(screen.getAllByTestId("plus-icon")).toHaveLength(2);
  });

  it("renders an accessible icon-only button", () => {
    render(
      <Button type="icon" aria-label="Add item" startIcon={<PlusIcon />} />,
    );
    const button = screen.getByRole("button", { name: "Add item" });
    expect(button).toHaveAttribute("data-type", "icon");
    expect(button).toHaveAttribute("data-variant", "ghost");
  });

  it("stays focusable and blocks activation while loading", () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Save" });
    button.focus();
    expect(button).toHaveFocus();
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not submit its form while loading", () => {
    const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" loading>
          Send
        </Button>
      </form>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("renders a link styled as a button when href is set", () => {
    render(
      <Button href="/billing" variant="secondary">
        View billing
      </Button>,
    );
    const link = screen.getByRole("link", { name: "View billing" });
    expect(link).toHaveAttribute("href", "/billing");
    expect(link).toHaveAttribute("data-variant", "secondary");
  });

  it("removes a disabled link from navigation", () => {
    const onClick = vi.fn();
    render(
      <Button href="/billing" disabled onClick={onClick}>
        View billing
      </Button>,
    );
    const link = screen.getByText("View billing").closest("a")!;
    expect(link).not.toHaveAttribute("href");
    expect(link).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(link);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("exposes full width and motion state for styling", () => {
    render(
      <Button fullWidth disableAnimation>
        Continue
      </Button>,
    );
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-full-width", "true");
    expect(button).toHaveAttribute("data-motion", "none");
  });

  it("keeps start and end icon order in the DOM so RTL mirrors them", () => {
    render(
      <div dir="rtl">
        <Button
          startIcon={<span data-testid="start" />}
          endIcon={<span data-testid="end" />}
        >
          حفظ
        </Button>
      </div>,
    );
    const start = screen.getByTestId("start");
    expect(
      start.compareDocumentPosition(screen.getByTestId("end")) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
