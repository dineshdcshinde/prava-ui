import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PravaProvider } from "../provider";
import { Tab, TabList, TabPanel, Tabs } from "./Tabs";
import type { TabsProps } from "./Tabs";

const setup = (props: Partial<TabsProps> = {}) =>
  render(
    <Tabs {...({ defaultValue: "a", ...props } as TabsProps)}>
      <TabList aria-label="Settings">
        <Tab value="a">Alpha</Tab>
        <Tab value="b">Beta</Tab>
        <Tab value="c" disabled>
          Gamma
        </Tab>
        <Tab value="d">Delta</Tab>
      </TabList>
      <TabPanel value="a">Panel A</TabPanel>
      <TabPanel value="b">Panel B</TabPanel>
      <TabPanel value="c">Panel C</TabPanel>
      <TabPanel value="d">
        Panel D <input aria-label="Field" />
      </TabPanel>
    </Tabs>,
  );
const tab = (name: string) => screen.getByRole("tab", { name });

describe("Tabs", () => {
  it("links tabs and panels and exposes selection", () => {
    setup();
    expect(screen.getByRole("tablist")).toHaveAccessibleName("Settings");
    expect(tab("Alpha")).toHaveAttribute("aria-selected", "true");
    expect(tab("Beta")).toHaveAttribute("aria-selected", "false");
    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveTextContent("Panel A");
    expect(tab("Alpha").getAttribute("aria-controls")).toBe(panel.id);
    expect(panel.getAttribute("aria-labelledby")).toBe(tab("Alpha").id);
  });

  it("keeps only the selected tab in the tab order and hides other panels", () => {
    setup();
    expect(tab("Alpha")).toHaveAttribute("tabindex", "0");
    expect(tab("Beta")).toHaveAttribute("tabindex", "-1");
    expect(screen.getByText("Panel B")).toHaveAttribute("hidden");
  });

  it("selects as focus moves in automatic mode, skipping disabled tabs and wrapping", async () => {
    const onValueChange = vi.fn();
    setup({ onValueChange });
    tab("Alpha").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(tab("Beta")).toHaveFocus();
    expect(tab("Beta")).toHaveAttribute("aria-selected", "true");
    expect(onValueChange).toHaveBeenLastCalledWith("b");
    await userEvent.keyboard("{ArrowRight}");
    expect(tab("Delta")).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    expect(tab("Alpha")).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(tab("Delta")).toHaveFocus();
    await userEvent.keyboard("{Home}");
    expect(tab("Alpha")).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(tab("Delta")).toHaveFocus();
  });

  it("moves focus without selecting in manual mode until Enter or Space", async () => {
    setup({ activation: "manual" });
    tab("Alpha").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(tab("Beta")).toHaveFocus();
    expect(tab("Beta")).toHaveAttribute("aria-selected", "false");
    await userEvent.keyboard("{Enter}");
    expect(tab("Beta")).toHaveAttribute("aria-selected", "true");
  });

  it("mirrors the arrow keys in RTL", async () => {
    render(
      <PravaProvider direction="rtl">
        <Tabs defaultValue="a">
          <TabList aria-label="Settings">
            <Tab value="a">Alpha</Tab>
            <Tab value="b">Beta</Tab>
          </TabList>
          <TabPanel value="a">A</TabPanel>
          <TabPanel value="b">B</TabPanel>
        </Tabs>
      </PravaProvider>,
    );
    // happy-dom doesn't compute direction from dir, so assert what the list reads.
    const list = screen.getByRole("tablist");
    list.style.direction = "rtl";
    tab("Alpha").focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(tab("Beta")).toHaveFocus();
  });

  it("uses up and down when vertical", async () => {
    setup({ orientation: "vertical" });
    expect(screen.getByRole("tablist")).toHaveAttribute(
      "aria-orientation",
      "vertical",
    );
    tab("Alpha").focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(tab("Beta")).toHaveFocus();
    await userEvent.keyboard("{ArrowUp}");
    expect(tab("Alpha")).toHaveFocus();
  });

  it("follows a controlled value", async () => {
    const onValueChange = vi.fn();
    setup({ value: "b", defaultValue: undefined, onValueChange });
    await userEvent.click(tab("Delta"));
    expect(onValueChange).toHaveBeenCalledWith("d");
    expect(tab("Beta")).toHaveAttribute("aria-selected", "true");
  });

  it("keeps hidden panels mounted, so their state survives", async () => {
    setup({ defaultValue: "d" });
    await userEvent.type(screen.getByLabelText("Field"), "kept");
    await userEvent.click(tab("Alpha"));
    await userEvent.click(tab("Delta"));
    expect(screen.getByLabelText("Field")).toHaveValue("kept");
  });

  it("does not select a disabled tab on click", async () => {
    setup();
    await userEvent.click(tab("Gamma"));
    expect(tab("Gamma")).toHaveAttribute("aria-selected", "false");
  });

  it("builds valid ids from values with spaces", () => {
    render(
      <Tabs defaultValue="my tab">
        <TabList aria-label="X">
          <Tab value="my tab">One</Tab>
        </TabList>
        <TabPanel value="my tab">Body</TabPanel>
      </Tabs>,
    );
    expect(tab("One").id).not.toMatch(/\s/);
    expect(tab("One").getAttribute("aria-controls")).not.toMatch(/\s/);
  });

  it("requires parts to be inside Tabs", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Tab value="a">A</Tab>)).toThrow(/inside <Tabs>/);
    spy.mockRestore();
  });
});
