import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Textarea } from "./Textarea";

describe("Textarea", () => {
  it("forwards its native ref and attributes", () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<label htmlFor="message">Message</label>);
    const { rerender } = render(
      <Textarea ref={ref} id="message" name="message" rows={5} resize="none" />,
    );
    expect(screen.getByRole("textbox", { name: "Message" })).toBe(ref.current);
    expect(ref.current).toHaveAttribute("rows", "5");
    expect(ref.current).toHaveAttribute("data-resize", "none");
    rerender(<Textarea ref={ref} aria-label="Message" invalid />);
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });

  it("has no drag handle by default and sizes between rows and maxRows", () => {
    render(<Textarea aria-label="Note" rows={2} maxRows={4} />);
    const note = screen.getByRole("textbox", { name: "Note" });
    expect(note).toHaveAttribute("data-resize", "none");
    expect(note).toHaveAttribute("rows", "2");
    expect(note.style.minBlockSize).toContain("2 * 1lh");
    expect(note.style.maxBlockSize).toContain("4 * 1lh");
  });

  it("keeps the handle opt-in", () => {
    render(<Textarea aria-label="Note" resize="vertical" />);
    expect(screen.getByRole("textbox", { name: "Note" })).toHaveAttribute(
      "data-resize",
      "vertical",
    );
  });

  it("measures typed and ref-set values where field-sizing is unsupported", () => {
    vi.stubGlobal("CSS", undefined);
    const height = vi
      .spyOn(HTMLTextAreaElement.prototype, "scrollHeight", "get")
      .mockReturnValue(120);
    render(<Textarea aria-label="Note" />);
    const note = screen.getByRole<HTMLTextAreaElement>("textbox", {
      name: "Note",
    });
    height.mockReturnValue(200);
    note.value = "set by react-hook-form reset";
    expect(note.style.height).toBe("200px");
    expect(note.value).toBe("set by react-hook-form reset");
    height.mockRestore();
    vi.unstubAllGlobals();
  });
});
