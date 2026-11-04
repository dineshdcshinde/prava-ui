import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PravaProvider } from "../provider";
import { dismissToast, toast, Toaster } from "./Toast";

// Resolves usePresence's exit promise and the store removal that follows it.
const settle = () => act(() => vi.advanceTimersByTimeAsync(0));
const visible = () => document.querySelector(".prava-toaster__list")!;

describe("Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(async () => {
    act(() => dismissToast());
    await settle();
    vi.useRealTimers();
  });

  it("is empty until toast() is called, and returns an id", () => {
    render(<Toaster />);
    expect(visible().children).toHaveLength(0);
    let id = "";
    act(() => {
      id = toast({ title: "Saved", description: "All changes" });
    });
    expect(id).toBeTruthy();
    expect(visible()).toHaveTextContent("SavedAll changes");
  });

  it("names its region with a localized label", () => {
    render(
      <PravaProvider messages={{ notifications: "Avis" }}>
        <Toaster />
      </PravaProvider>,
    );
    expect(
      document.querySelector('[role="region"]')!.getAttribute("aria-label"),
    ).toBe("Avis");
  });

  it("announces politely, and danger urgently, in regions that exist up front", () => {
    render(<Toaster />);
    const polite = document.querySelector('[role="status"]')!;
    const urgent = document.querySelector('[role="alert"]')!;
    expect(polite).toBeEmptyDOMElement();
    act(() => void toast({ title: "Saved" }));
    expect(polite).toHaveTextContent("Saved");
    expect(urgent).toBeEmptyDOMElement();
    act(() => void toast({ title: "Failed", tone: "danger" }));
    expect(urgent).toHaveTextContent("Failed");
    expect(polite).not.toHaveTextContent("Failed");
  });

  it("does not make visible toasts live regions, so nothing is read twice", () => {
    render(<Toaster />);
    act(() => void toast({ title: "Saved" }));
    expect(
      visible().querySelector('[role="status"],[role="alert"]'),
    ).toBeNull();
  });

  it("dismisses itself after its duration", async () => {
    render(<Toaster />);
    act(() => void toast({ title: "Saved", duration: 1000 }));
    await act(() => vi.advanceTimersByTimeAsync(999));
    expect(visible().children).toHaveLength(1);
    await act(() => vi.advanceTimersByTimeAsync(1));
    await settle();
    expect(visible().children).toHaveLength(0);
  });

  it("keeps danger until it is dismissed", async () => {
    render(<Toaster />);
    act(() => void toast({ title: "Failed", tone: "danger" }));
    await act(() => vi.advanceTimersByTimeAsync(600000));
    expect(visible().children).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    await settle();
    expect(visible().children).toHaveLength(0);
  });

  it("gives more time when there is an action", async () => {
    render(<Toaster />);
    act(
      () =>
        void toast({
          title: "Deleted",
          action: <button type="button">Undo</button>,
        }),
    );
    await act(() => vi.advanceTimersByTimeAsync(9999));
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(1));
    await settle();
    expect(screen.queryByRole("button", { name: "Undo" })).toBeNull();
  });

  it("pauses while hovered and keeps the time it had left", async () => {
    render(<Toaster />);
    const region = document.querySelector('[role="region"]')!;
    act(() => void toast({ title: "Saved", duration: 1000 }));
    await act(() => vi.advanceTimersByTimeAsync(600));
    fireEvent.pointerEnter(region);
    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(visible().children).toHaveLength(1);
    fireEvent.pointerLeave(region);
    await act(() => vi.advanceTimersByTimeAsync(399));
    expect(visible().children).toHaveLength(1);
    await act(() => vi.advanceTimersByTimeAsync(1));
    await settle();
    expect(visible().children).toHaveLength(0);
  });

  it("pauses while keyboard focus is inside", async () => {
    render(<Toaster />);
    act(() => void toast({ title: "Saved", duration: 1000 }));
    fireEvent.focus(screen.getByRole("button", { name: "Dismiss" }));
    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(visible().children).toHaveLength(1);
  });

  it("updates in place with the same id and restarts its time", async () => {
    render(<Toaster />);
    act(() => void toast({ id: "job", title: "Saving", duration: 1000 }));
    await act(() => vi.advanceTimersByTimeAsync(900));
    act(() => void toast({ id: "job", title: "Saved", duration: 1000 }));
    expect(visible().children).toHaveLength(1);
    expect(visible()).toHaveTextContent("Saved");
    await act(() => vi.advanceTimersByTimeAsync(900));
    expect(visible().children).toHaveLength(1);
  });

  it("dismisses everything with no id", async () => {
    render(<Toaster />);
    act(() => {
      toast({ title: "One", duration: Infinity });
      toast({ title: "Two", duration: Infinity });
    });
    expect(visible().children).toHaveLength(2);
    act(() => dismissToast());
    await settle();
    expect(visible().children).toHaveLength(0);
  });

  it("forwards placement and attributes", () => {
    render(<Toaster placement="top-center" className="custom" />);
    const region = document.querySelector('[role="region"]')!;
    expect(region).toHaveAttribute("data-placement", "top-center");
    expect(region).toHaveClass("prava-toaster", "custom");
  });
});
