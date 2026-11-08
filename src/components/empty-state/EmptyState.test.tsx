import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../button";
import { PravaProvider } from "../provider";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("renders only the title when nothing else is given", () => {
    const { container } = render(<EmptyState title="No results" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("prava-empty-state");
    expect(root.children).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "No results" })).toBeVisible();
  });

  it("defaults to a level 3 heading and honors headingLevel", () => {
    const { rerender } = render(<EmptyState title="Empty" />);
    expect(screen.getByRole("heading", { level: 3 })).toBeVisible();
    for (const level of [2, 4, 5, 6] as const) {
      rerender(<EmptyState title="Empty" headingLevel={level} />);
      expect(screen.getByRole("heading", { level })).toBeVisible();
    }
  });

  it("hides the icon from assistive technology", () => {
    render(<EmptyState title="Empty" icon={<svg data-testid="icon" />} />);
    expect(screen.getByTestId("icon").parentElement).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("shows the description and a working, keyboard-reachable action", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <EmptyState
        title="No invoices"
        description="They appear after your first payment."
        action={<Button onClick={onClick}>Add payment</Button>}
      />,
    );
    expect(
      screen.getByText("They appear after your first payment."),
    ).toBeVisible();
    await user.tab();
    expect(screen.getByRole("button", { name: "Add payment" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("leaves out slots whose content is conditionally empty", () => {
    const { container } = render(
      <EmptyState title="Empty" icon={null} description="" action={false} />,
    );
    expect(container.firstElementChild?.children).toHaveLength(1);
  });

  it("forwards the ref, native attributes, className and style", () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <EmptyState
        ref={ref}
        title="Empty"
        role="status"
        data-testid="root"
        className="custom"
        style={{ opacity: 0.5 }}
      />,
    );
    const root = screen.getByTestId("root");
    expect(ref.current).toBe(root);
    expect(root).toHaveAttribute("role", "status");
    expect(root).toHaveClass("prava-empty-state", "custom");
    expect(root).toHaveStyle({ opacity: "0.5" });
    // `title` is the heading, never the native tooltip attribute.
    expect(root).not.toHaveAttribute("title");
  });

  it("renders inside a right-to-left provider", () => {
    render(
      <PravaProvider direction="rtl" locale="ar">
        <EmptyState title="لا توجد فواتير" />
      </PravaProvider>,
    );
    expect(
      screen.getByRole("heading", { name: "لا توجد فواتير" }).closest("[dir]"),
    ).toHaveAttribute("dir", "rtl");
  });
});
