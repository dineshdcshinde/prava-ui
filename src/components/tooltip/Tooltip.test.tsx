import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Tooltip } from "./Tooltip";

const setup = (props = {}) =>
  render(
    <Tooltip content="Visible to your team" {...props}>
      <button type="button">Publish</button>
    </Tooltip>,
  );
const trigger = () => screen.getByRole("button", { name: "Publish" });
const tip = () => document.querySelector<HTMLElement>('[role="tooltip"]')!;
const hover = (type: "pointerEnter" | "pointerLeave") =>
  fireEvent[type](trigger(), { pointerType: "mouse" });

describe("Tooltip", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("describes its trigger even while hidden", () => {
    setup();
    expect(tip()).toHaveTextContent("Visible to your team");
    expect(trigger()).toHaveAttribute("aria-describedby", tip().id);
    expect(tip()).not.toHaveAttribute("data-open");
  });

  it("waits for the delay on hover", () => {
    setup({ delay: 300 });
    hover("pointerEnter");
    act(() => vi.advanceTimersByTime(299));
    expect(tip()).not.toHaveAttribute("data-open");
    act(() => vi.advanceTimersByTime(1));
    expect(tip()).toHaveAttribute("data-open");
  });

  it("does not show if the pointer leaves before the delay", () => {
    setup({ delay: 300 });
    hover("pointerEnter");
    act(() => vi.advanceTimersByTime(100));
    hover("pointerLeave");
    act(() => vi.advanceTimersByTime(1000));
    expect(tip()).not.toHaveAttribute("data-open");
  });

  it("stays open while the pointer crosses onto it", () => {
    setup({ delay: 0 });
    hover("pointerEnter");
    act(() => vi.advanceTimersByTime(0));
    hover("pointerLeave");
    act(() => vi.advanceTimersByTime(50));
    fireEvent.pointerEnter(tip(), { pointerType: "mouse" });
    act(() => vi.advanceTimersByTime(1000));
    expect(tip()).toHaveAttribute("data-open");
  });

  it("hides on Escape without closing what surrounds it", () => {
    const outer = vi.fn();
    render(
      <div onKeyDown={outer}>
        <Tooltip content="Tip">
          <button type="button">Publish</button>
        </Tooltip>
      </div>,
    );
    hover("pointerEnter");
    act(() => vi.advanceTimersByTime(1000));
    fireEvent.keyDown(trigger(), { key: "Escape" });
    expect(tip()).not.toHaveAttribute("data-open");
    expect(outer).not.toHaveBeenCalled();
    fireEvent.keyDown(trigger(), { key: "Escape" });
    expect(outer).toHaveBeenCalledOnce();
  });

  it("shows on a touch tap and hides on a press elsewhere", () => {
    setup();
    fireEvent.pointerUp(trigger(), { pointerType: "touch" });
    expect(tip()).toHaveAttribute("data-open");
    fireEvent.pointerDown(document.body);
    expect(tip()).not.toHaveAttribute("data-open");
  });

  it("merges with the trigger's handlers and forwards attributes", () => {
    const onClick = vi.fn();
    render(
      <Tooltip content="Tip" className="custom" data-testid="t">
        <button type="button" onClick={onClick}>
          Publish
        </button>
      </Tooltip>,
    );
    fireEvent.click(trigger());
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByTestId("t")).toHaveClass("prava-tooltip", "custom");
  });
});

describe("Tooltip keyboard", () => {
  it("shows at once on keyboard focus and hides on blur", async () => {
    setup();
    await userEvent.tab();
    expect(trigger()).toHaveFocus();
    expect(tip()).toHaveAttribute("data-open");
    await userEvent.tab();
    expect(tip()).not.toHaveAttribute("data-open");
  });
});
