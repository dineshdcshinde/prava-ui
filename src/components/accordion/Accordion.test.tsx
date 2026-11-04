import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Accordion, AccordionItem } from "./Accordion";
import type { AccordionProps } from "./Accordion";

const setup = (props: AccordionProps = {}) =>
  render(
    <Accordion {...props}>
      <AccordionItem value="a" title="Alpha">
        Panel A
      </AccordionItem>
      <AccordionItem value="b" title="Beta">
        Panel B
      </AccordionItem>
      <AccordionItem value="c" title="Gamma" disabled>
        Panel C
      </AccordionItem>
      <AccordionItem value="d" title="Delta">
        Panel D
      </AccordionItem>
    </Accordion>,
  );
const header = (name: string) => screen.getByRole("button", { name });

describe("Accordion", () => {
  it("uses buttons inside headings, linked to their panels", () => {
    setup({ headingLevel: 4 });
    expect(
      screen.getByRole("heading", { level: 4, name: "Alpha" }),
    ).toContainElement(header("Alpha"));
    const panel = document.getElementById(
      header("Alpha").getAttribute("aria-controls")!,
    )!;
    expect(panel).toHaveTextContent("Panel A");
    expect(panel).toHaveAttribute("role", "region");
    expect(panel.getAttribute("aria-labelledby")).toBe(header("Alpha").id);
  });

  it("opens one at a time by default and can collapse the open one", async () => {
    setup({ defaultValue: ["a"] });
    expect(header("Alpha")).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(header("Beta"));
    expect(header("Alpha")).toHaveAttribute("aria-expanded", "false");
    expect(header("Beta")).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(header("Beta"));
    expect(header("Beta")).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps several open with multiple", async () => {
    const onValueChange = vi.fn();
    setup({ multiple: true, onValueChange });
    await userEvent.click(header("Alpha"));
    await userEvent.click(header("Beta"));
    expect(header("Alpha")).toHaveAttribute("aria-expanded", "true");
    expect(header("Beta")).toHaveAttribute("aria-expanded", "true");
    expect(onValueChange).toHaveBeenLastCalledWith(["a", "b"]);
  });

  it("follows a controlled value", async () => {
    const onValueChange = vi.fn();
    setup({ value: ["a"], onValueChange });
    await userEvent.click(header("Beta"));
    expect(onValueChange).toHaveBeenCalledWith(["b"]);
    expect(header("Alpha")).toHaveAttribute("aria-expanded", "true");
    expect(header("Beta")).toHaveAttribute("aria-expanded", "false");
  });

  it("does not toggle a disabled item", async () => {
    setup();
    await userEvent.click(header("Gamma"));
    expect(header("Gamma")).toHaveAttribute("aria-expanded", "false");
  });

  it("moves between headers with arrows, Home and End, skipping disabled ones", async () => {
    setup();
    header("Alpha").focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(header("Beta")).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(header("Delta")).toHaveFocus();
    await userEvent.keyboard("{ArrowDown}");
    expect(header("Alpha")).toHaveFocus();
    await userEvent.keyboard("{ArrowUp}");
    expect(header("Delta")).toHaveFocus();
    await userEvent.keyboard("{Home}");
    expect(header("Alpha")).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(header("Delta")).toHaveFocus();
  });

  it("toggles with Enter and Space", async () => {
    setup();
    header("Alpha").focus();
    await userEvent.keyboard("{Enter}");
    expect(header("Alpha")).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard(" ");
    expect(header("Alpha")).toHaveAttribute("aria-expanded", "false");
  });

  it("does not hijack arrow keys inside a panel", async () => {
    render(
      <Accordion defaultValue={["a"]}>
        <AccordionItem value="a" title="Alpha">
          <input aria-label="Field" />
        </AccordionItem>
      </Accordion>,
    );
    const field = screen.getByLabelText("Field");
    field.focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(field).toHaveFocus();
  });

  it("forwards attributes on root and item", () => {
    render(
      <Accordion className="root" data-testid="r">
        <AccordionItem value="a" title="A" className="item" data-testid="i" />
      </Accordion>,
    );
    expect(screen.getByTestId("r")).toHaveClass("prava-accordion", "root");
    expect(screen.getByTestId("i")).toHaveClass("item");
  });

  it("requires items to be inside Accordion", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<AccordionItem value="a" title="A" />)).toThrow(
      /inside <Accordion>/,
    );
    spy.mockRestore();
  });
});
