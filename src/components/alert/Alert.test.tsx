import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PravaProvider } from "../provider";
import { Alert } from "./Alert";

describe("Alert", () => {
  it("is a polite status by default and interrupts only when asked", () => {
    const { rerender } = render(<Alert title="Saved">Done</Alert>);
    expect(screen.getByRole("status")).toHaveTextContent("SavedDone");
    rerender(<Alert role="alert">Failed</Alert>);
    expect(screen.getByRole("alert")).toHaveTextContent("Failed");
  });

  it("marks the tone and keeps the icon out of the accessibility tree", () => {
    const { container } = render(<Alert tone="danger">Failed</Alert>);
    expect(screen.getByRole("status")).toHaveAttribute("data-tone", "danger");
    expect(container.querySelector(".prava-alert__icon")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("replaces or removes the icon", () => {
    const { container, rerender } = render(
      <Alert icon={<i>custom</i>}>A</Alert>,
    );
    expect(screen.getByText("custom")).toBeInTheDocument();
    rerender(<Alert icon={null}>A</Alert>);
    expect(container.querySelector(".prava-alert__icon")).toBeNull();
  });

  it("only offers dismissal when it can be handled, with a localized name", async () => {
    const onDismiss = vi.fn();
    const { rerender } = render(<Alert>Message</Alert>);
    expect(screen.queryByRole("button")).toBeNull();
    rerender(
      <PravaProvider messages={{ dismiss: "Fermer" }}>
        <Alert onDismiss={onDismiss}>Message</Alert>
      </PravaProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Fermer" }));
    expect(onDismiss).toHaveBeenCalledOnce();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders the action and forwards native attributes and the ref", () => {
    let node: HTMLDivElement | null = null;
    render(
      <Alert
        ref={(el) => {
          node = el;
        }}
        className="custom"
        style={{ width: 200 }}
        action={<button type="button">Retry</button>}
      >
        Failed
      </Alert>,
    );
    const root = screen.getByRole("status");
    expect(node).toBe(root);
    expect(root).toHaveClass("prava-alert", "custom");
    expect(root).toHaveStyle({ width: "200px" });
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
