import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { PravaProvider } from "../provider/PravaProvider";
import { Tag } from "./Tag";

describe("Tag", () => {
  it("renders a static label with no controls, forwarding the ref and native attributes", () => {
    const ref = createRef<HTMLSpanElement>();
    render(
      <Tag
        ref={ref}
        data-testid="t"
        className="custom"
        style={{ margin: 1 }}
        icon={<svg data-testid="icon" />}
      >
        Design
      </Tag>,
    );
    const tag = screen.getByTestId("t");
    expect(ref.current).toBe(tag);
    expect(tag).toHaveClass("prava-tag", "custom");
    expect(tag).toHaveStyle({ margin: "1px" });
    expect(tag).toHaveAttribute("data-tone", "neutral");
    expect(tag).toHaveAttribute("data-size", "md");
    expect(tag).not.toHaveAttribute("data-selected");
    expect(screen.getByTestId("icon").parentElement).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("applies tone and size", () => {
    render(
      <Tag tone="danger" size="sm" data-testid="t">
        Late
      </Tag>,
    );
    expect(screen.getByTestId("t")).toHaveAttribute("data-tone", "danger");
    expect(screen.getByTestId("t")).toHaveAttribute("data-size", "sm");
  });

  it("names the remove button with the tag text and leaves removal to the consumer", async () => {
    const onRemove = vi.fn();
    render(<Tag onRemove={onRemove}>Design</Tag>);
    const remove = screen.getByRole("button", { name: "Remove Design" });
    expect(remove).toHaveAttribute("type", "button");
    await userEvent.click(remove);
    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledWith();
    expect(screen.getByText("Design")).toBeInTheDocument();
  });

  it("removes from the keyboard with Enter and Space", async () => {
    const onRemove = vi.fn();
    render(<Tag onRemove={onRemove}>Design</Tag>);
    await userEvent.tab();
    expect(screen.getByRole("button")).toHaveFocus();
    await userEvent.keyboard("{Enter} ");
    expect(onRemove).toHaveBeenCalledTimes(2);
  });

  it("reads the remove name from rendered text when children are not a string", () => {
    const Translated = () => <>Design</>;
    const { rerender } = render(
      <Tag onRemove={() => {}}>
        <Translated />
      </Tag>,
    );
    expect(
      screen.getByRole("button", { name: "Remove Design" }),
    ).toBeInTheDocument();
    rerender(
      <Tag onRemove={() => {}}>
        <b>Research</b>
      </Tag>,
    );
    expect(
      screen.getByRole("button", { name: "Remove Research" }),
    ).toBeInTheDocument();
  });

  it("uses provider messages for the remove name", () => {
    render(
      <PravaProvider
        direction="rtl"
        locale="ar"
        messages={{ removeTag: "إزالة {label}" }}
      >
        <Tag onRemove={() => {}}>تصميم</Tag>
      </PravaProvider>,
    );
    expect(
      screen.getByRole("button", { name: "إزالة تصميم" }),
    ).toBeInTheDocument();
  });

  it("controlled selection reports the next state and follows the prop", async () => {
    const onSelectedChange = vi.fn();
    const { rerender } = render(
      <Tag selected={false} onSelectedChange={onSelectedChange} data-testid="t">
        Open
      </Tag>,
    );
    const toggle = screen.getByRole("button", { name: "Open", pressed: false });
    await userEvent.click(toggle);
    expect(onSelectedChange).toHaveBeenCalledWith(true);
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    rerender(
      <Tag selected onSelectedChange={onSelectedChange} data-testid="t">
        Open
      </Tag>,
    );
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("t")).toHaveAttribute("data-selected", "true");
    await userEvent.click(toggle);
    expect(onSelectedChange).toHaveBeenLastCalledWith(false);
  });

  it("tracks its own state when only onSelectedChange is set", async () => {
    const onSelectedChange = vi.fn();
    render(<Tag onSelectedChange={onSelectedChange}>Open</Tag>);
    const toggle = screen.getByRole("button", { name: "Open" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    toggle.focus();
    await userEvent.keyboard(" ");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(onSelectedChange.mock.calls).toEqual([[true], [false]]);
  });

  it("selected={false} alone still renders a real toggle", () => {
    render(<Tag selected={false}>Open</Tag>);
    expect(screen.getByRole("button", { name: "Open" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("renders select and remove as two sibling controls, each doing only its job", async () => {
    function Example() {
      const [selected, setSelected] = useState(false);
      const [removed, setRemoved] = useState(false);
      return removed ? (
        <p>gone</p>
      ) : (
        <Tag
          selected={selected}
          onSelectedChange={setSelected}
          onRemove={() => setRemoved(true)}
        >
          Open
        </Tag>
      );
    }
    render(<Example />);
    const toggle = screen.getByRole("button", { name: "Open" });
    const remove = screen.getByRole("button", { name: "Remove Open" });
    expect(toggle.contains(remove)).toBe(false);
    expect(remove.contains(toggle)).toBe(false);
    expect(toggle.parentElement).toBe(remove.parentElement);

    await userEvent.tab();
    expect(toggle).toHaveFocus();
    await userEvent.tab();
    expect(remove).toHaveFocus();

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(remove);
    expect(screen.getByText("gone")).toBeInTheDocument();
  });
});
