import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DropdownMenu } from "./DropdownMenu";
import type { DropdownMenuItem } from "./DropdownMenu";

const onRename = vi.fn();
const onDelete = vi.fn();
const items: DropdownMenuItem[] = [
  { label: "Rename", onSelect: onRename },
  { label: "Duplicate" },
  { label: "Archive", disabled: true, onSelect: onDelete },
  { separator: true },
  {
    label: "Danger zone",
    items: [{ label: "Delete", tone: "danger", onSelect: onDelete }],
  },
  { label: "Docs", href: "https://example.com/docs" },
];
const setup = (props = {}) =>
  render(
    <DropdownMenu
      trigger={<button type="button">Actions</button>}
      items={items}
      {...props}
    />,
  );
const trigger = () => screen.getByRole("button", { name: "Actions" });
const byText = (name: string) =>
  screen.getByText(name).closest<HTMLElement>('[role="menuitem"]')!;
const isOpen = () => trigger().getAttribute("aria-expanded") === "true";

describe("DropdownMenu", () => {
  it("wires the menu button pattern", () => {
    setup();
    const menu = document.querySelector<HTMLElement>('[role="menu"]')!;
    expect(trigger()).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger()).toHaveAttribute("aria-controls", menu.id);
    expect(menu.getAttribute("aria-labelledby")).toBe(trigger().id);
  });

  it("opens on the first item with Enter and ArrowDown, and the last with ArrowUp", async () => {
    setup();
    trigger().focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(byText("Rename")).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    expect(isOpen()).toBe(false);
    expect(trigger()).toHaveFocus();

    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(byText("Rename")).toHaveFocus());
    await userEvent.keyboard("{Escape}");

    await userEvent.keyboard("{ArrowUp}");
    await waitFor(() => expect(byText("Docs")).toHaveFocus());
  });

  it("wraps with arrows, jumps with Home and End, and includes disabled items", async () => {
    setup({ defaultOpen: true });
    byText("Rename").focus();
    await userEvent.keyboard("{ArrowUp}");
    expect(byText("Docs")).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(byText("Rename")).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(byText("Docs")).toHaveFocus();
    await userEvent.keyboard("{Home}");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}");
    expect(byText("Archive")).toHaveFocus();
  });

  it("moves by typing, stepping through repeats", async () => {
    setup({ defaultOpen: true });
    byText("Rename").focus();
    await userEvent.keyboard("d");
    expect(byText("Duplicate")).toHaveFocus();
    await userEvent.keyboard("d");
    expect(byText("Delete")).toHaveFocus();
  });

  it("chooses an item, closes, returns focus first, then calls onSelect", async () => {
    let focusedAtSelect: Element | null = null;
    onRename.mockImplementationOnce(() => {
      focusedAtSelect = document.activeElement;
    });
    setup({ defaultOpen: true });
    await userEvent.click(byText("Rename"));
    expect(onRename).toHaveBeenCalledOnce();
    expect(isOpen()).toBe(false);
    expect(focusedAtSelect).toBe(trigger());
  });

  it("does not choose a disabled item or close on it", async () => {
    setup({ defaultOpen: true });
    onDelete.mockClear();
    const archive = byText("Archive");
    expect(archive).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(archive);
    expect(onDelete).not.toHaveBeenCalled();
    expect(isOpen()).toBe(true);
  });

  it("closes on Tab and returns focus to the trigger's place", async () => {
    setup({ defaultOpen: true });
    byText("Rename").focus();
    fireEvent.keyDown(byText("Rename"), { key: "Tab" });
    expect(isOpen()).toBe(false);
    expect(trigger()).toHaveFocus();
  });

  it("closes on an outside press", () => {
    setup({ defaultOpen: true });
    fireEvent.pointerDown(document.body);
    expect(isOpen()).toBe(false);
  });

  it("renders separators, labelled groups, links, and tones", () => {
    setup({ defaultOpen: true });
    expect(document.querySelector('[role="separator"]')).toBeInTheDocument();
    const group = document.querySelector('[role="group"]')!;
    expect(group.getAttribute("aria-labelledby")).toBe(
      screen.getByText("Danger zone").id,
    );
    expect(byText("Docs").tagName).toBe("A");
    expect(byText("Docs")).toHaveAttribute("href", "https://example.com/docs");
    expect(byText("Delete")).toHaveAttribute("data-tone", "danger");
  });

  it("stops Escape from reaching a surrounding dialog", async () => {
    const outer = vi.fn();
    render(
      <div onKeyDown={outer}>
        <DropdownMenu
          defaultOpen
          trigger={<button type="button">Actions</button>}
          items={items}
        />
      </div>,
    );
    fireEvent.keyDown(byText("Rename"), { key: "Escape" });
    expect(outer).not.toHaveBeenCalled();
    expect(isOpen()).toBe(false);
  });
});
