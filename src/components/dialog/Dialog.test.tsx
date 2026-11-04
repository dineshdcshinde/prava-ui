import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { PravaProvider } from "../provider";
import { Dialog, DialogClose } from "./Dialog";

// happy-dom hides closed dialogs from role queries inconsistently, so query the element directly.
const dialog = () => document.querySelector("dialog")!;

describe("Dialog", () => {
  it("opens from its trigger, names itself, and describes itself", async () => {
    render(
      <Dialog
        trigger={<button type="button">Open</button>}
        title="Delete project"
        description="This can't be undone."
      >
        Body
      </Dialog>,
    );
    const trigger = screen.getByRole("button", { name: "Open" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(dialog().open).toBe(false);
    expect(screen.queryByText("Body")).toBeNull();

    await userEvent.click(trigger);
    expect(dialog().open).toBe(true);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    const heading = screen.getByRole("heading", { name: "Delete project" });
    expect(dialog().getAttribute("aria-labelledby")).toBe(heading.id);
    expect(dialog().getAttribute("aria-describedby")).toBe(
      screen.getByText("This can't be undone.").id,
    );
    expect(screen.getByText("Body")).toBeInTheDocument();
  });

  it("closes from the close button with a localized name and unmounts content", async () => {
    const onOpenChange = vi.fn();
    render(
      <PravaProvider messages={{ close: "Fermer" }}>
        <Dialog defaultOpen title="T" onOpenChange={onOpenChange}>
          Body
        </Dialog>
      </PravaProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Fermer" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(dialog().open).toBe(false);
    expect(await screen.findByText("T").catch(() => null)).toBeNull();
  });

  it("closes on Escape only when dismissible", () => {
    const { rerender } = render(<Dialog defaultOpen title="T" />);
    fireEvent.keyDown(dialog(), { key: "Escape" });
    expect(dialog().open).toBe(false);

    rerender(<Dialog open dismissible={false} title="T" />);
    fireEvent.keyDown(dialog(), { key: "Escape" });
    expect(dialog().open).toBe(true);
  });

  it("closes on a backdrop press, but not after a drag that started inside", () => {
    render(<Dialog defaultOpen title="T" />);
    const panel = dialog().firstElementChild!;
    fireEvent.pointerDown(panel);
    fireEvent.click(dialog());
    expect(dialog().open).toBe(true);
    fireEvent.pointerDown(dialog());
    fireEvent.click(dialog());
    expect(dialog().open).toBe(false);
  });

  it("does not close on an outside press when not dismissible or not modal", () => {
    const { rerender } = render(<Dialog open dismissible={false} title="T" />);
    fireEvent.pointerDown(dialog());
    fireEvent.click(dialog());
    expect(dialog().open).toBe(true);
    rerender(<Dialog open modal={false} title="T" />);
    fireEvent.pointerDown(dialog());
    fireEvent.click(dialog());
    expect(dialog().open).toBe(true);
  });

  it("follows a controlled open prop and stays open if the parent says so", async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <Dialog open title="T" onOpenChange={onOpenChange} />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(dialog().open).toBe(true);
    rerender(<Dialog open={false} title="T" onOpenChange={onOpenChange} />);
    expect(dialog().open).toBe(false);
  });

  it("DialogClose closes it and keeps the child's own handler", async () => {
    const onClick = vi.fn();
    render(
      <Dialog
        defaultOpen
        title="T"
        footer={
          <DialogClose>
            <button type="button" onClick={onClick}>
              Cancel
            </button>
          </DialogClose>
        }
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(dialog().open).toBe(false);
  });

  it("locks page scroll while modal and restores it", () => {
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <>
          <button type="button" onClick={() => setOpen(false)}>
            toggle
          </button>
          <Dialog open={open} title="T" />
        </>
      );
    }
    render(<Harness />);
    expect(document.documentElement.style.overflow).toBe("hidden");
    fireEvent.click(screen.getByText("toggle"));
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("does not lock page scroll when non-modal", () => {
    render(<Dialog defaultOpen modal={false} title="T" />);
    expect(dialog().open).toBe(true);
    expect(document.documentElement.style.overflow).toBe("");
  });

  it("applies slots, size, native attributes, and consumer handlers", () => {
    const onKeyDown = vi.fn();
    let node: HTMLDialogElement | null = null;
    render(
      <Dialog
        ref={(el) => {
          node = el;
        }}
        defaultOpen
        title="T"
        size="lg"
        className="root"
        classNames={{ title: "title-slot", body: "body-slot" }}
        data-testid="d"
        onKeyDown={onKeyDown}
      >
        Body
      </Dialog>,
    );
    expect(node).toBe(dialog());
    expect(dialog()).toHaveClass("prava-dialog", "root");
    expect(dialog()).toHaveAttribute("data-size", "lg");
    expect(screen.getByRole("heading")).toHaveClass("title-slot");
    expect(screen.getByText("Body")).toHaveClass("body-slot");
    fireEvent.keyDown(dialog(), { key: "a" });
    expect(onKeyDown).toHaveBeenCalledOnce();
  });
});
