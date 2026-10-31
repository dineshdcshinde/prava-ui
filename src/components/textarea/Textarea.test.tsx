import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
});
