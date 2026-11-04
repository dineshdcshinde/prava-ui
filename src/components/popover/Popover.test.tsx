import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Popover } from "./Popover";

const setup = (props = {}) =>
  render(
    <>
      <Popover
        trigger={<button type="button">Share</button>}
        title="Share project"
        {...props}
      >
        <button type="button">Copy link</button>
      </Popover>
      <button type="button">After</button>
    </>,
  );
const trigger = () => screen.getByRole("button", { name: "Share" });
const popup = () => document.querySelector<HTMLElement>(".prava-popover")!;

describe("Popover", () => {
  it("toggles from its trigger and links them", async () => {
    setup();
    expect(trigger()).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(trigger());
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(trigger()).toHaveAttribute("aria-controls", popup().id);
    expect(popup()).toHaveAttribute("data-open");
    await userEvent.click(trigger());
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("names itself from its title and is not a menu", async () => {
    setup();
    await userEvent.click(trigger());
    expect(popup()).toHaveAttribute("role", "dialog");
    expect(popup().getAttribute("aria-labelledby")).toBe(
      screen.getByText("Share project").id,
    );
  });

  it("moves focus to the first focusable child, or to itself when there is none", async () => {
    const { unmount } = setup();
    await userEvent.click(trigger());
    expect(screen.getByRole("button", { name: "Copy link" })).toHaveFocus();
    unmount();
    render(
      <Popover
        trigger={<button type="button">Info</button>}
        aria-label="Details"
      >
        Plain text
      </Popover>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Info" }));
    expect(popup()).toHaveFocus();
  });

  it("Escape closes it and returns focus to the trigger", async () => {
    setup();
    await userEvent.click(trigger());
    await userEvent.keyboard("{Escape}");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(trigger()).toHaveFocus();
  });

  it("closes on an outside press, and not on a press inside", async () => {
    setup();
    await userEvent.click(trigger());
    fireEvent.pointerDown(screen.getByRole("button", { name: "Copy link" }));
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    fireEvent.pointerDown(document.body);
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("closes when focus moves outside", async () => {
    setup();
    await userEvent.click(trigger());
    act(() => screen.getByRole("button", { name: "After" }).focus());
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("follows a controlled open prop", async () => {
    const onOpenChange = vi.fn();
    setup({ open: true, onOpenChange });
    await userEvent.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
  });

  it("keeps the trigger's own handlers and forwards attributes to the surface", async () => {
    const onClick = vi.fn();
    render(
      <Popover
        trigger={
          <button type="button" onClick={onClick}>
            Share
          </button>
        }
        className="custom"
        style={{ width: 200 }}
        data-testid="surface"
      >
        Body
      </Popover>,
    );
    await userEvent.click(trigger());
    expect(onClick).toHaveBeenCalledOnce();
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("surface")).toHaveClass("custom");
    expect(screen.getByTestId("surface")).toHaveStyle({ width: "200px" });
  });
});
