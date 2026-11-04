import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Drawer, DrawerClose } from "./Drawer";

const drawer = () => document.querySelector("dialog")!;

describe("Drawer", () => {
  it("defaults to the end edge and keeps Dialog behavior", async () => {
    render(
      <Drawer trigger={<button type="button">Open</button>} title="Filters">
        Fields
      </Drawer>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(drawer().open).toBe(true);
    expect(drawer()).toHaveAttribute("data-placement", "end");
    expect(drawer()).toHaveClass("prava-dialog", "prava-drawer");
    fireEvent.keyDown(drawer(), { key: "Escape" });
    expect(drawer().open).toBe(false);
  });

  it("takes a placement and a custom class", () => {
    render(
      <Drawer defaultOpen title="T" placement="bottom" className="custom" />,
    );
    expect(drawer()).toHaveAttribute("data-placement", "bottom");
    expect(drawer()).toHaveClass("custom");
  });

  it("closes from DrawerClose", async () => {
    render(
      <Drawer
        defaultOpen
        title="T"
        footer={
          <DrawerClose>
            <button type="button">Apply</button>
          </DrawerClose>
        }
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(drawer().open).toBe(false);
  });

  it("forwards its ref to the dialog", () => {
    let node: HTMLDialogElement | null = null;
    render(
      <Drawer
        ref={(el) => {
          node = el;
        }}
        title="T"
      />,
    );
    expect(node).toBe(drawer());
  });
});
