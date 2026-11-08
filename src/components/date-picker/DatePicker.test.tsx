import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PravaProvider } from "../provider";
import {
  addDays,
  addMonths,
  Calendar,
  firstDayOfWeek,
  isIsoDate,
  readDates,
  type DateRange,
} from "./Calendar";
import { DatePicker, parseTyped } from "./DatePicker";

const cell = (iso: string) =>
  document.querySelector<HTMLElement>(`[data-date="${iso}"]`)!;
const focusedDate = () =>
  (document.activeElement as HTMLElement | null)?.dataset.date;
const dialog = () => document.querySelector("dialog")!;
const picker = (name = "Choose date") =>
  screen.getByRole("button", { name: new RegExp(name) });
const open = () => userEvent.click(picker("(Choose|Change) date"));

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("ISO date math", () => {
  it("accepts real dates only, including leap days", () => {
    expect(isIsoDate("2024-02-29")).toBe(true);
    expect(isIsoDate("2000-02-29")).toBe(true);
    expect(isIsoDate("2025-02-29")).toBe(false);
    expect(isIsoDate("1900-02-29")).toBe(false);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("2026-1-1")).toBe(false);
    expect(isIsoDate("2026-11-05T00:00")).toBe(false);
    expect(isIsoDate(undefined)).toBe(false);
  });

  it("crosses month, year and leap boundaries", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2025-02-28", 1)).toBe("2025-03-01");
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2024-01-31", 1)).toBe("2024-02-29");
    expect(addMonths("2026-03-31", -1)).toBe("2026-02-28");
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
    expect(addMonths("2024-02-29", 12)).toBe("2025-02-28");
    expect(addMonths("0050-06-15", 12)).toBe("0051-06-15");
  });

  it.each([
    "Pacific/Kiritimati",
    "Pacific/Pago_Pago",
    "America/New_York",
    "Asia/Kolkata",
    "UTC",
  ])("keeps the same day in %s", (zone) => {
    vi.stubEnv("TZ", zone);
    // 2026-03-08 is a daylight change in New York.
    expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
    expect(addDays("2026-03-07", 1)).toBe("2026-03-08");
    render(<Calendar defaultValue="2026-01-01" />);
    expect(screen.getByText("January 2026")).toBeInTheDocument();
    expect(cell("2026-01-01")).toHaveAttribute(
      "aria-label",
      "Thursday, January 1, 2026",
    );
    expect(cell("2026-01-01")).toHaveAttribute("aria-selected", "true");
  });

  it("marks today from the local day, not the UTC day", () => {
    vi.stubEnv("TZ", "Pacific/Kiritimati"); // UTC+14
    vi.useFakeTimers({
      now: new Date("2026-11-05T12:00:00Z"),
      toFake: ["Date"],
    });
    render(<Calendar />);
    expect(cell("2026-11-06")).toHaveAttribute("aria-current", "date");
    expect(cell("2026-11-05")).not.toHaveAttribute("aria-current");
  });

  it("reads and sorts ranges, and rejects invalid ones", () => {
    expect(readDates("2026-01-01")).toEqual(["2026-01-01", "2026-01-01"]);
    expect(readDates("2026-02-01/2026-01-01")).toEqual([
      "2026-01-01",
      "2026-02-01",
    ]);
    expect(readDates(["2026-01-01", "nope"])).toBeUndefined();
    expect(readDates("")).toBeUndefined();
    expect(readDates(null)).toBeUndefined();
  });
});

describe("first day of the week", () => {
  const cases = [
    ["en-US", 0],
    ["en-GB", 1],
    ["de", 1],
    ["ar-EG", 6],
    ["ja", 0],
  ] as const;

  it.each(cases)("%s from Intl", (locale, day) => {
    expect(firstDayOfWeek(locale)).toBe(day);
  });

  it.each(cases)("%s when the browser has no week info", (locale, day) => {
    const proto = Intl.Locale.prototype as unknown as Record<string, unknown>;
    const saved = Object.getOwnPropertyDescriptors(proto);
    delete proto.getWeekInfo;
    delete proto.weekInfo;
    try {
      expect(firstDayOfWeek(locale)).toBe(day);
    } finally {
      Object.defineProperties(proto, saved);
    }
  });

  it("orders the header by locale", () => {
    const { unmount } = render(
      <PravaProvider locale="en-US">
        <Calendar defaultValue="2026-11-05" />
      </PravaProvider>,
    );
    expect(screen.getAllByRole("columnheader")[0]).toHaveAttribute(
      "abbr",
      "Sunday",
    );
    unmount();
    render(
      <PravaProvider locale="en-GB">
        <Calendar defaultValue="2026-11-05" />
      </PravaProvider>,
    );
    expect(screen.getAllByRole("columnheader")[0]).toHaveAttribute(
      "abbr",
      "Monday",
    );
  });
});

describe("typed dates", () => {
  it("follows the locale's order", () => {
    expect(parseTyped("3/4/2026", "en-US", 1)).toEqual(["2026-03-04"]);
    expect(parseTyped("3/4/2026", "en-GB", 1)).toEqual(["2026-04-03"]);
    expect(parseTyped("03.04.2026", "de", 1)).toEqual(["2026-04-03"]);
    expect(parseTyped("2026. 3. 4.", "ko", 1)).toEqual(["2026-03-04"]);
  });

  it("always accepts ISO, and locale digits", () => {
    expect(parseTyped("2026-03-04", "en-GB", 1)).toEqual(["2026-03-04"]);
    expect(parseTyped("٠٤/٠٣/٢٠٢٦", "ar-EG", 1)).toEqual(["2026-03-04"]);
  });

  it("rejects what isn't a real date", () => {
    expect(parseTyped("2/30/2026", "en-US", 1)).toBeNull();
    expect(parseTyped("2/29/2025", "en-US", 1)).toBeNull();
    expect(parseTyped("13/1/2026", "en-US", 1)).toBeNull();
    expect(parseTyped("1/2/26", "en-US", 1)).toBeNull();
    expect(parseTyped("tomorrow", "en-US", 1)).toBeNull();
    expect(parseTyped("1/2/2026", "en-US", 2)).toBeNull();
  });

  it("reads two dates for a range", () => {
    expect(parseTyped("1/2/2026 – 1/5/2026", "en-US", 2)).toEqual([
      "2026-01-02",
      "2026-01-05",
    ]);
  });
});

describe("Calendar", () => {
  it("is a labelled grid with one tab stop", () => {
    render(<Calendar defaultValue="2026-11-05" />);
    const grid = screen.getByRole("grid", { name: "November 2026" });
    expect(grid).toBeInTheDocument();
    expect(document.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
    expect(cell("2026-11-05")).toHaveAttribute("tabindex", "0");
    expect(cell("2026-11-05")).toHaveAttribute("aria-selected", "true");
    expect(cell("2026-11-06")).toHaveAttribute("aria-selected", "false");
    expect(screen.getByText("November 2026")).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  it("forwards native attributes, className, style, slots and ref", () => {
    const ref = { current: null as HTMLDivElement | null };
    render(
      <Calendar
        ref={ref}
        data-testid="root"
        className="mine"
        style={{ color: "red" }}
        classNames={{ day: "slot-day" }}
      />,
    );
    expect(ref.current).toBe(screen.getByTestId("root"));
    expect(ref.current).toHaveClass("prava-calendar", "mine");
    expect(ref.current?.style.color).toBe("red");
    expect(document.querySelector(".slot-day")).not.toBeNull();
  });

  it("moves with arrows, Home and End, across month edges", async () => {
    render(<Calendar defaultValue="2026-11-30" />);
    cell("2026-11-30").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(focusedDate()).toBe("2026-12-01");
    expect(screen.getByText("December 2026")).toBeInTheDocument();
    await userEvent.keyboard("{ArrowLeft}");
    expect(focusedDate()).toBe("2026-11-30");
    await userEvent.keyboard("{ArrowDown}");
    expect(focusedDate()).toBe("2026-12-07");
    await userEvent.keyboard("{ArrowUp}");
    expect(focusedDate()).toBe("2026-11-30");
    // 2026-11-30 is a Monday; en starts the week on Sunday.
    await userEvent.keyboard("{Home}");
    expect(focusedDate()).toBe("2026-11-29");
    await userEvent.keyboard("{End}");
    expect(focusedDate()).toBe("2026-12-05");
  });

  it("pages by month and year, keeping or clamping the day", async () => {
    render(<Calendar defaultValue="2024-01-31" />);
    cell("2024-01-31").focus();
    await userEvent.keyboard("{PageDown}");
    expect(focusedDate()).toBe("2024-02-29");
    await userEvent.keyboard("{Shift>}{PageDown}{/Shift}");
    expect(focusedDate()).toBe("2025-02-28");
    await userEvent.keyboard("{PageUp}");
    expect(focusedDate()).toBe("2025-01-28");
    await userEvent.keyboard("{Shift>}{PageUp}{/Shift}");
    expect(focusedDate()).toBe("2024-01-28");
    await userEvent.keyboard("{PageUp}");
    expect(focusedDate()).toBe("2023-12-28");
  });

  it("mirrors left and right in RTL only", async () => {
    render(
      <div style={{ direction: "rtl" }} dir="rtl">
        <Calendar defaultValue="2026-11-10" />
      </div>,
    );
    cell("2026-11-10").focus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(focusedDate()).toBe("2026-11-11");
    await userEvent.keyboard("{ArrowRight}");
    expect(focusedDate()).toBe("2026-11-10");
    await userEvent.keyboard("{ArrowDown}");
    expect(focusedDate()).toBe("2026-11-17");
  });

  it("selects with Enter and Space, controlled or not", async () => {
    const onValueChange = vi.fn();
    render(
      <Calendar defaultValue="2026-11-10" onValueChange={onValueChange} />,
    );
    cell("2026-11-10").focus();
    await userEvent.keyboard("{ArrowRight}{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("2026-11-11");
    expect(cell("2026-11-11")).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowRight} ");
    expect(onValueChange).toHaveBeenLastCalledWith("2026-11-12");
  });

  it("stays on the controlled value until the parent changes it", async () => {
    const { rerender } = render(<Calendar value="2026-11-10" />);
    await userEvent.click(cell("2026-11-12"));
    expect(cell("2026-11-10")).toHaveAttribute("aria-selected", "true");
    expect(cell("2026-11-12")).toHaveAttribute("aria-selected", "false");
    rerender(<Calendar value="2027-03-01" />);
    expect(screen.getByText("March 2027")).toBeInTheDocument();
  });

  it("keeps focus inside min and max, and stops the buttons there", async () => {
    render(
      <Calendar defaultValue="2026-11-10" min="2026-11-05" max="2026-11-20" />,
    );
    cell("2026-11-10").focus();
    await userEvent.keyboard("{PageUp}");
    expect(focusedDate()).toBe("2026-11-05");
    await userEvent.keyboard("{ArrowLeft}");
    expect(focusedDate()).toBe("2026-11-05");
    await userEvent.keyboard("{PageDown}");
    expect(focusedDate()).toBe("2026-11-20");
    expect(cell("2026-11-04")).toHaveAttribute("aria-disabled", "true");
    expect(cell("2026-11-21")).toHaveAttribute("aria-disabled", "true");
    const previous = screen.getByRole("button", { name: "Previous month" });
    expect(previous).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(previous);
    expect(screen.getByText("November 2026")).toBeInTheDocument();
  });

  it("opens on the limit when today is outside it", () => {
    vi.useFakeTimers({
      now: new Date("2026-11-05T12:00:00"),
      toFake: ["Date"],
    });
    render(<Calendar min="2027-02-10" />);
    expect(screen.getByText("February 2027")).toBeInTheDocument();
    expect(cell("2027-02-10")).toHaveAttribute("tabindex", "0");
  });

  it("reaches a disabled date by keyboard but won't select it", async () => {
    const onValueChange = vi.fn();
    render(
      <Calendar
        defaultValue="2026-11-10"
        isDateDisabled={(date) => date === "2026-11-11"}
        onValueChange={onValueChange}
      />,
    );
    cell("2026-11-10").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(focusedDate()).toBe("2026-11-11");
    expect(cell("2026-11-11")).toHaveAttribute("aria-disabled", "true");
    await userEvent.keyboard("{Enter}");
    await userEvent.click(cell("2026-11-11"));
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("changes month and year from the buttons without moving focus", async () => {
    render(<Calendar defaultValue="2026-01-31" />);
    const next = screen.getByRole("button", { name: "Next month" });
    await userEvent.click(next);
    expect(screen.getByText("February 2026")).toBeInTheDocument();
    expect(next).toHaveFocus();
    expect(cell("2026-02-28")).toHaveAttribute("tabindex", "0");
    await userEvent.click(screen.getByRole("button", { name: "Next year" }));
    expect(screen.getByText("February 2027")).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Previous year" }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Previous month" }),
    );
    expect(screen.getByText("January 2026")).toBeInTheDocument();
  });

  it("picks a range in either order and reports it once, sorted", async () => {
    const onValueChange = vi.fn();
    render(
      <Calendar
        mode="range"
        defaultValue={["2026-11-02", "2026-11-03"]}
        onValueChange={onValueChange}
      />,
    );
    expect(screen.getByRole("grid")).toHaveAttribute(
      "aria-multiselectable",
      "true",
    );
    await userEvent.click(cell("2026-11-20"));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(cell("2026-11-20")).toHaveAttribute("aria-selected", "true");
    await userEvent.hover(cell("2026-11-10"));
    expect(cell("2026-11-15")).toHaveAttribute("data-in-range");
    await userEvent.click(cell("2026-11-10"));
    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith(["2026-11-10", "2026-11-20"]);
    expect(cell("2026-11-10")).toHaveAttribute("data-start");
    expect(cell("2026-11-20")).toHaveAttribute("data-end");
    expect(cell("2026-11-15")).toHaveAttribute("aria-selected", "true");
    expect(cell("2026-11-21")).toHaveAttribute("aria-selected", "false");
  });

  it("picks a range across a year by keyboard", async () => {
    const onValueChange = vi.fn();
    render(
      <Calendar
        mode="range"
        defaultValue={["2026-12-30", "2026-12-30"]}
        onValueChange={onValueChange}
      />,
    );
    cell("2026-12-30").focus();
    await userEvent.keyboard("{Enter}{ArrowDown}{Enter}");
    expect(onValueChange).toHaveBeenCalledWith(["2026-12-30", "2027-01-06"]);
  });

  it("formats with the provider's locale, always Gregorian", () => {
    render(
      <PravaProvider locale="th-TH-u-nu-latn">
        <Calendar defaultValue="2026-11-05" />
      </PravaProvider>,
    );
    // The default Thai calendar would say 2569.
    expect(cell("2026-11-05").getAttribute("aria-label")).toContain("2026");
    expect(cell("2026-11-05").getAttribute("aria-label")).not.toContain("2569");
  });

  it("uses the provider's messages", () => {
    render(
      <PravaProvider
        messages={{
          previousMonth: "Mois précédent",
          nextYear: "Année suivante",
        }}
      >
        <Calendar />
      </PravaProvider>,
    );
    expect(
      screen.getByRole("button", { name: "Mois précédent" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Année suivante" }),
    ).toBeInTheDocument();
  });

  it("treats an invalid value as none", () => {
    vi.useFakeTimers({
      now: new Date("2026-11-05T12:00:00"),
      toFake: ["Date"],
    });
    render(<Calendar value="2026-02-30" />);
    expect(screen.getByText("November 2026")).toBeInTheDocument();
    expect(document.querySelector('[aria-selected="true"]')).toBeNull();
  });
});

describe("DatePicker dialog", () => {
  it("names its parts and shows the value in the locale's format", () => {
    render(
      <DatePicker
        label="Due"
        description="Help"
        error="Wrong"
        defaultValue="2026-11-05"
      />,
    );
    const input = screen.getByRole("textbox", { name: "Due" });
    expect(input).toHaveValue("11/05/2026");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toContain("description");
    expect(input.getAttribute("aria-describedby")).toContain("error");
    const button = picker("Change date, Thursday, November 5, 2026");
    expect(button).toHaveAttribute("aria-haspopup", "dialog");
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("opens as a modal, focused on the value, and Escape returns to the button", async () => {
    render(<DatePicker aria-label="Due" defaultValue="2026-11-05" />);
    await open();
    expect(dialog().open).toBe(true);
    expect(dialog()).toHaveAttribute("aria-modal", "true");
    expect(dialog()).toHaveAttribute("aria-label", "Choose date");
    expect(focusedDate()).toBe("2026-11-05");
    await userEvent.keyboard("{Escape}");
    expect(dialog().open).toBe(false);
    expect(picker("Change date")).toHaveFocus();
  });

  it("opens on today without a value, and from the keyboard", async () => {
    vi.useFakeTimers({
      now: new Date("2026-11-05T12:00:00"),
      toFake: ["Date"],
    });
    render(<DatePicker aria-label="Due" />);
    fireEvent.click(picker());
    expect(focusedDate()).toBe("2026-11-05");
  });

  it("chooses a date, closes and returns focus", async () => {
    const onValueChange = vi.fn();
    render(
      <DatePicker
        aria-label="Due"
        defaultValue="2026-11-05"
        onValueChange={onValueChange}
      />,
    );
    await open();
    await userEvent.keyboard("{ArrowRight}{Enter}");
    expect(onValueChange).toHaveBeenCalledWith("2026-11-06");
    expect(dialog().open).toBe(false);
    expect(screen.getByRole("textbox")).toHaveValue("11/06/2026");
    expect(picker("Change date, Friday, November 6, 2026")).toHaveFocus();
  });

  it("closes on a press on the backdrop without changing the value", async () => {
    const onValueChange = vi.fn();
    render(
      <DatePicker
        aria-label="Due"
        defaultValue="2026-11-05"
        onValueChange={onValueChange}
      />,
    );
    await open();
    fireEvent.click(dialog());
    expect(dialog().open).toBe(false);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("doesn't close a surrounding handler on Escape", async () => {
    const outer = vi.fn();
    render(
      <div onKeyDown={outer}>
        <DatePicker aria-label="Due" />
      </div>,
    );
    await open();
    outer.mockClear();
    await userEvent.keyboard("{Escape}");
    expect(outer).not.toHaveBeenCalled();
  });

  it("disables both controls", () => {
    render(<DatePicker aria-label="Due" disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(picker()).toBeDisabled();
  });

  it("can't be changed read-only", () => {
    render(<DatePicker aria-label="Due" readOnly />);
    expect(screen.getByRole("textbox")).toHaveAttribute("readonly");
    expect(picker()).toBeDisabled();
  });

  it("reads provider direction and messages", async () => {
    render(
      <PravaProvider
        locale="de"
        direction="rtl"
        messages={{ chooseDate: "Datum wählen", changeDate: "Ändern: {date}" }}
      >
        <DatePicker aria-label="Fällig" />
      </PravaProvider>,
    );
    expect(picker("Datum wählen")).toBeInTheDocument();
    await userEvent.type(screen.getByRole("textbox"), "03.04.2026{Enter}");
    expect(screen.getByRole("textbox")).toHaveValue("03.04.2026");
    expect(
      screen.getByRole("button", { name: /^Ändern: .*April 2026$/ }),
    ).toBeInTheDocument();
  });

  it("picks a range and closes only after the second date", async () => {
    const onValueChange = vi.fn();
    render(
      <DatePicker
        aria-label="Trip"
        mode="range"
        defaultValue={["2026-11-05", "2026-11-06"]}
        onValueChange={onValueChange}
      />,
    );
    await open();
    await userEvent.keyboard("{Enter}");
    expect(dialog().open).toBe(true);
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(dialog().open).toBe(false);
    expect(onValueChange).toHaveBeenCalledWith(["2026-11-05", "2026-11-12"]);
    expect(screen.getByRole("textbox")).toHaveValue("11/05/2026 – 11/12/2026");
  });
});

describe("DatePicker typed entry", () => {
  const type = (text: string) =>
    userEvent.type(screen.getByRole("textbox"), text);

  it("commits on blur and on Enter", async () => {
    const onValueChange = vi.fn();
    render(<DatePicker aria-label="Due" onValueChange={onValueChange} />);
    await type("2/29/2024");
    expect(onValueChange).not.toHaveBeenCalled();
    await userEvent.tab();
    expect(onValueChange).toHaveBeenLastCalledWith("2024-02-29");
    expect(screen.getByRole("textbox")).toHaveValue("02/29/2024");
    await userEvent.clear(screen.getByRole("textbox"));
    await type("2026-03-04{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("2026-03-04");
  });

  it("clears with empty text", async () => {
    const onValueChange = vi.fn();
    render(
      <DatePicker
        aria-label="Due"
        defaultValue="2026-03-04"
        onValueChange={onValueChange}
      />,
    );
    await userEvent.clear(screen.getByRole("textbox"));
    await userEvent.tab();
    expect(onValueChange).toHaveBeenLastCalledWith("");
  });

  it("keeps a bad entry, empties the value and explains", async () => {
    const onValueChange = vi.fn();
    render(
      <DatePicker
        aria-label="Due"
        defaultValue="2026-03-04"
        onValueChange={onValueChange}
      />,
    );
    await userEvent.clear(screen.getByRole("textbox"));
    await type("2/30/2026");
    await userEvent.tab();
    expect(onValueChange).toHaveBeenLastCalledWith("");
    expect(screen.getByRole("textbox")).toHaveValue("2/30/2026");
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("Enter a valid value.")).toBeInTheDocument();
    await userEvent.clear(screen.getByRole("textbox"));
    await type("3/1/2026");
    await userEvent.tab();
    expect(onValueChange).toHaveBeenLastCalledWith("2026-03-01");
    expect(screen.queryByText("Enter a valid value.")).toBeNull();
    expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid");
  });

  it("rejects typed dates outside min, max and isDateDisabled", async () => {
    const onValueChange = vi.fn();
    render(
      <DatePicker
        aria-label="Due"
        min="2026-03-01"
        max="2026-03-31"
        isDateDisabled={(date) => date === "2026-03-15"}
        onValueChange={onValueChange}
      />,
    );
    await type("2/28/2026");
    await userEvent.tab();
    expect(screen.getByText("Enter 03/01/2026 or more.")).toBeInTheDocument();
    await userEvent.clear(screen.getByRole("textbox"));
    await type("4/1/2026");
    await userEvent.tab();
    expect(screen.getByText("Enter 03/31/2026 or less.")).toBeInTheDocument();
    await userEvent.clear(screen.getByRole("textbox"));
    await type("3/15/2026");
    await userEvent.tab();
    expect(screen.getByText("This date isn't available.")).toBeInTheDocument();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("types a range, sorted", async () => {
    const onValueChange = vi.fn();
    render(
      <DatePicker
        aria-label="Trip"
        mode="range"
        onValueChange={onValueChange}
      />,
    );
    await type("1/5/2026 - 1/2/2026");
    await userEvent.tab();
    expect(onValueChange).toHaveBeenCalledWith(["2026-01-02", "2026-01-05"]);
  });

  it("drops a rejected entry when the value changes from outside", async () => {
    function Harness() {
      const [date, setDate] = useState("2026-03-04");
      return (
        <>
          <DatePicker aria-label="Due" value={date} onValueChange={setDate} />
          <button type="button" onClick={() => setDate("2026-05-06")}>
            Set
          </button>
        </>
      );
    }
    render(<Harness />);
    await userEvent.clear(screen.getByRole("textbox"));
    await type("nope");
    await userEvent.tab();
    expect(screen.getByRole("textbox")).toHaveValue("nope");
    await userEvent.click(screen.getByRole("button", { name: "Set" }));
    expect(screen.getByRole("textbox")).toHaveValue("05/06/2026");
    expect(screen.queryByText("Enter a valid value.")).toBeNull();
  });
});

describe("DatePicker in forms", () => {
  it("submits ISO through the hidden control, and a range as start/end", () => {
    render(
      <form data-testid="form">
        <DatePicker aria-label="One" name="one" defaultValue="2026-11-05" />
        <DatePicker
          aria-label="Two"
          name="two"
          mode="range"
          defaultValue={["2026-11-05", "2026-11-06"]}
        />
      </form>,
    );
    const data = new FormData(screen.getByTestId<HTMLFormElement>("form"));
    expect(data.get("one")).toBe("2026-11-05");
    expect(data.get("two")).toBe("2026-11-05/2026-11-06");
  });

  it("restores the initial date on form reset", async () => {
    render(
      <form data-testid="form">
        <DatePicker aria-label="Due" name="due" defaultValue="2026-11-05" />
      </form>,
    );
    await userEvent.clear(screen.getByRole("textbox"));
    await userEvent.type(screen.getByRole("textbox"), "1/1/2027");
    await userEvent.tab();
    expect(screen.getByRole("textbox")).toHaveValue("01/01/2027");
    fireEvent.reset(screen.getByTestId("form"));
    await waitFor(() =>
      expect(screen.getByRole("textbox")).toHaveValue("11/05/2026"),
    );
  });

  it("shows the localized required message on submit", () => {
    render(
      <form data-testid="form">
        <DatePicker aria-label="Due" name="due" required />
      </form>,
    );
    const hidden =
      document.querySelector<HTMLInputElement>('input[name="due"]')!;
    fireEvent.invalid(hidden);
    expect(screen.getByText("Fill in this field.")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute(
      "aria-required",
      "true",
    );
  });

  it("works with register: value, setValue, reset and focus", async () => {
    let form!: ReturnType<typeof useForm<{ due: string }>>;
    const onSubmit = vi.fn();
    function Harness() {
      form = useForm<{ due: string }>({ defaultValues: { due: "2026-11-05" } });
      return (
        <form
          onSubmit={form.handleSubmit((values) => onSubmit(values))}
          noValidate
        >
          <DatePicker
            aria-label="Due"
            field={form.register("due", { required: "Pick one" })}
            error={form.formState.errors.due?.message}
          />
          <button type="submit">Save</button>
        </form>
      );
    }
    render(<Harness />);
    const input = screen.getByRole("textbox");
    await waitFor(() => expect(input).toHaveValue("11/05/2026"));

    await open();
    await userEvent.keyboard("{ArrowRight}{Enter}");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenLastCalledWith({ due: "2026-11-06" }),
    );

    form.setValue("due", "2027-01-02");
    await waitFor(() => expect(input).toHaveValue("01/02/2027"));

    form.reset();
    await waitFor(() => expect(input).toHaveValue("11/05/2026"));

    await userEvent.clear(input);
    await userEvent.tab();
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Pick one")).toBeInTheDocument();
    expect(input).toHaveFocus();
  });

  it("works with Controller, including a range as a pair", async () => {
    const onSubmit = vi.fn();
    function Harness() {
      const { control, handleSubmit } = useForm<{ trip: DateRange }>({
        defaultValues: { trip: ["2026-11-05", "2026-11-06"] },
      });
      return (
        <form onSubmit={handleSubmit((values) => onSubmit(values))} noValidate>
          <Controller
            name="trip"
            control={control}
            render={({ field }) => (
              <DatePicker aria-label="Trip" mode="range" field={field} />
            )}
          />
          <button type="submit">Save</button>
        </form>
      );
    }
    render(<Harness />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveValue("11/05/2026 – 11/06/2026");
    await open();
    await userEvent.keyboard("{Enter}{ArrowDown}{Enter}");
    await waitFor(() => expect(input).toHaveValue("11/05/2026 – 11/12/2026"));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        trip: ["2026-11-05", "2026-11-12"],
      }),
    );
  });
});
