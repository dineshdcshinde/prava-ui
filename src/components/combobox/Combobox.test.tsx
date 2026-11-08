import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { FormField } from "../form-field";
import { PravaProvider } from "../provider";
import { Combobox } from "./Combobox";

const options = [
  { value: "pune", label: "Pune", state: "MH" },
  { value: "patna", label: "Patna", description: "Bihar", state: "BR" },
  { value: "leh", label: "Leh", disabled: true, state: "LA" },
  { value: "goa", label: "Goa", state: "GA" },
];
const input = (name: string | RegExp = "City") =>
  screen.getByRole("combobox", { name });
const names = () =>
  screen
    .queryAllByRole("option")
    .map((o) => o.querySelector(".prava-combobox__text > span")?.textContent);
const activeOption = () =>
  document.getElementById(input().getAttribute("aria-activedescendant") ?? "");
// happy-dom's FormData reads only one value of a multiple select; tests/e2e/combobox.spec.ts covers the real one.
const chosen = () =>
  Array.from(document.querySelector("select")?.options ?? [])
    .filter((o) => o.selected)
    .map((o) => o.value);
const formValues = (el: HTMLFormElement) =>
  Object.fromEntries(new FormData(el).entries());

describe("Combobox", () => {
  it("exposes the editable combobox pattern and stays closed on focus", async () => {
    const user = userEvent.setup();
    render(<Combobox label="City" options={options} placeholder="Search" />);
    const el = input();
    expect(el.tagName).toBe("INPUT");
    expect(el).toHaveAttribute("aria-autocomplete", "list");
    expect(el).toHaveAttribute("aria-expanded", "false");
    expect(el).toHaveAttribute("placeholder", "Search");
    await user.tab();
    expect(el).toHaveFocus();
    expect(el).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("option")).toBeNull();

    await user.keyboard("{ArrowDown}");
    const list = screen.getByRole("listbox");
    expect(el).toHaveAttribute("aria-expanded", "true");
    expect(el).toHaveAttribute("aria-controls", list.id);
    expect(screen.getByRole("listbox", { name: "City" })).toBe(list);
  });

  it("moves with the arrow keys, wraps, skips disabled, and accepts with Enter", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Combobox label="City" options={options} onValueChange={onValueChange} />,
    );
    await user.tab();
    await user.keyboard("{ArrowDown}");
    expect(activeOption()).toHaveTextContent("Pune");
    expect(input()).toHaveFocus(); // DOM focus never leaves the input
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(activeOption()).toHaveTextContent("Goa"); // past disabled Leh
    await user.keyboard("{ArrowDown}");
    expect(activeOption()).toHaveTextContent("Pune");
    await user.keyboard("{ArrowUp}");
    expect(activeOption()).toHaveTextContent("Goa");
    await user.keyboard("{Enter}");
    expect(input()).toHaveValue("Goa");
    expect(input()).toHaveAttribute("aria-expanded", "false");
    expect(onValueChange.mock.calls[0]?.[0]).toBe("goa");
    expect(onValueChange.mock.calls[0]?.[1].state).toBe("GA");

    // Reopening shows every option with the current one marked, not just the match for its text.
    await user.keyboard("{ArrowDown}");
    expect(names()).toHaveLength(4);
    expect(activeOption()).toHaveAttribute("aria-selected", "true");
  });

  it("ArrowUp opens on the last option, Alt+ArrowDown opens with none, Alt+ArrowUp closes", async () => {
    const user = userEvent.setup();
    render(<Combobox label="City" options={options} />);
    await user.tab();
    await user.keyboard("{ArrowUp}");
    expect(activeOption()).toHaveTextContent("Goa");
    await user.keyboard("{Alt>}{ArrowUp}{/Alt}");
    expect(input()).toHaveAttribute("aria-expanded", "false");
    await user.keyboard("{Alt>}{ArrowDown}{/Alt}");
    expect(input()).toHaveAttribute("aria-expanded", "true");
    expect(input()).not.toHaveAttribute("aria-activedescendant");
  });

  it("Escape closes and keeps the text, then clears, then leaves the key to a dialog", async () => {
    const user = userEvent.setup();
    const outer = vi.fn();
    render(
      <div onKeyDown={(e) => e.key === "Escape" && outer()}>
        <Combobox label="City" options={options} />
      </div>,
    );
    await user.type(input(), "pu");
    await user.keyboard("{Escape}");
    expect(input()).toHaveAttribute("aria-expanded", "false");
    expect(input()).toHaveValue("pu");
    await user.keyboard("{Escape}");
    expect(input()).toHaveValue("");
    expect(outer).not.toHaveBeenCalled();
    await user.keyboard("{Escape}");
    expect(outer).toHaveBeenCalledOnce();
  });

  it("filters as you type, ignoring case and accents, and highlights nothing", async () => {
    const user = userEvent.setup();
    render(
      <Combobox
        label="City"
        options={[...options, { value: "sp", label: "São Paulo" }]}
      />,
    );
    await user.type(input(), "PA");
    expect(names()).toEqual(["Patna", "São Paulo"]);
    expect(input()).not.toHaveAttribute("aria-activedescendant");
    await user.clear(input());
    await user.type(input(), "sao");
    expect(names()).toEqual(["São Paulo"]);
    await user.clear(input());
    await user.type(input(), "zzz");
    expect(names()).toEqual([]);
    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  it("Space types and caret keys edit the text, dropping the list highlight", async () => {
    const user = userEvent.setup();
    render(
      <Combobox label="City" options={[{ value: "sp", label: "São Paulo" }]} />,
    );
    await user.type(input(), "sao p");
    expect(input()).toHaveValue("sao p");
    await user.keyboard("{ArrowDown}");
    expect(activeOption()).toHaveTextContent("São Paulo");
    await user.keyboard("{Home}");
    expect(input()).not.toHaveAttribute("aria-activedescendant");
    expect(input()).toHaveValue("sao p");
  });

  it("filter={false} leaves results to the server and reports typed text", async () => {
    const user = userEvent.setup();
    const onInputValueChange = vi.fn();
    render(
      <Combobox
        label="City"
        options={options}
        filter={false}
        onInputValueChange={onInputValueChange}
      />,
    );
    await user.type(input(), "zz");
    expect(names()).toHaveLength(4);
    expect(onInputValueChange).toHaveBeenLastCalledWith("zz");
  });

  it("keeps a chosen label after server results replace the options", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Combobox label="City" filter={false} options={options} />,
    );
    await user.click(input());
    await user.click(screen.getByRole("option", { name: "Pune" }));
    rerender(<Combobox label="City" filter={false} options={[]} />);
    expect(input()).toHaveValue("Pune");
  });

  it("supports a controlled value and input value", async () => {
    const user = userEvent.setup();
    function Controlled() {
      const [value, setValue] = useState("pune");
      const [text, setText] = useState("Pune");
      return (
        <>
          <Combobox
            label="City"
            options={options}
            value={value}
            onValueChange={(v) => setValue(v)}
            inputValue={text}
            onInputValueChange={setText}
          />
          <output>{`${value}|${text}`}</output>
        </>
      );
    }
    render(<Controlled />);
    expect(input()).toHaveValue("Pune");
    await user.clear(input());
    await user.type(input(), "go");
    expect(screen.getByText("pune|go")).toBeInTheDocument();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(screen.getByText("goa|Goa")).toBeInTheDocument();
    expect(input()).toHaveValue("Goa");
  });

  it("leaving reverts unmatched text, accepts an exact match, and clears when empty", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <>
        <Combobox
          label="City"
          options={options}
          defaultValue="pune"
          onValueChange={onValueChange}
        />
        <button>after</button>
      </>,
    );
    await user.clear(input());
    await user.type(input(), "nowhere");
    await user.tab();
    expect(input()).toHaveValue("Pune");
    expect(onValueChange).not.toHaveBeenCalled();

    await user.clear(input());
    await user.type(input(), "goa");
    await user.tab();
    expect(input()).toHaveValue("Goa");
    expect(onValueChange).toHaveBeenLastCalledWith("goa", options[3]);

    await user.clear(input());
    await user.tab();
    expect(input()).toHaveValue("");
    expect(onValueChange).toHaveBeenLastCalledWith("", undefined);
  });

  it("Tab accepts the keyboard's option but not one the pointer is over", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Combobox label="City" options={options} />
        <button>after</button>
      </>,
    );
    await user.click(input());
    await user.hover(screen.getByRole("option", { name: "Goa" }));
    await user.tab();
    expect(input()).toHaveValue("");

    await user.click(input());
    await user.keyboard("{ArrowDown}");
    await user.tab();
    expect(input()).toHaveValue("Pune");
    expect(screen.getByRole("button", { name: "after" })).toHaveFocus();
  });

  it("Enter with no highlighted option doesn't submit partial text; closed Enter submits", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      return formValues(e.currentTarget);
    });
    render(
      <form onSubmit={onSubmit}>
        <Combobox label="City" name="city" options={options} />
        <button>Save</button>
      </form>,
    );
    await user.type(input(), "pu{Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(input()).toHaveValue("");
    await user.type(input(), "pune{Enter}");
    expect(onSubmit).not.toHaveBeenCalled();
    expect(input()).toHaveValue("Pune");
    await user.keyboard("{Enter}");
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit.mock.results[0]?.value).toEqual({ city: "pune" });
  });

  it("allowCustomValue keeps typed text on Enter and on blur", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <form aria-label="form">
        <Combobox
          label="City"
          name="city"
          options={options}
          allowCustomValue
          onValueChange={onValueChange}
        />
        <button type="button">after</button>
      </form>,
    );
    await user.type(input(), " Nashik {Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith("Nashik", undefined);
    expect(input()).toHaveValue("Nashik");
    expect(formValues(screen.getByRole<HTMLFormElement>("form"))).toEqual({
      city: "Nashik",
    });

    await user.clear(input());
    await user.type(input(), "Thane");
    await user.tab();
    expect(input()).toHaveValue("Thane");
    expect(formValues(screen.getByRole<HTMLFormElement>("form"))).toEqual({
      city: "Thane",
    });

    // An exact match still picks the real option, not a custom copy.
    await user.clear(input());
    await user.type(input(), "pune");
    await user.tab();
    expect(formValues(screen.getByRole<HTMLFormElement>("form"))).toEqual({
      city: "pune",
    });
  });

  it("multiple: chips, stays open, toggles, Backspace removes, text clears, submits all", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <form aria-label="form">
        <Combobox
          label="City"
          name="city"
          multiple
          options={options}
          defaultValue={["goa"]}
          onValueChange={onValueChange}
        />
      </form>,
    );
    expect(screen.getByRole("button", { name: "Remove Goa" })).toBeVisible();
    expect(input()).toHaveAccessibleDescription("1 selected");
    await user.type(input(), "pun");
    await user.keyboard("{ArrowDown}{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith(
      ["goa", "pune"],
      [options[3], options[0]],
    );
    expect(input()).toHaveValue("");
    expect(input()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox")).toHaveAttribute(
      "aria-multiselectable",
      "true",
    );
    expect(chosen()).toEqual(["pune", "goa"]);
    await user.keyboard("{Enter}"); // still on Pune: toggles off
    expect(onValueChange).toHaveBeenLastCalledWith(["goa"], [options[3]]);
    await user.keyboard("{Backspace}");
    expect(onValueChange).toHaveBeenLastCalledWith([], []);
    expect(chosen()).toEqual([]);
  });

  it("multiple with allowCustomValue adds a chip and submits it", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <form aria-label="form">
        <Combobox
          label="Tags"
          name="tags"
          multiple
          allowCustomValue
          options={options}
          onValueChange={onValueChange}
        />
      </form>,
    );
    await user.type(input("Tags"), "new one{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith(["new one"], []);
    expect(screen.getByText("new one")).toBeInTheDocument();
    expect(
      new FormData(screen.getByRole<HTMLFormElement>("form")).getAll("tags"),
    ).toEqual(["new one"]);
    await user.click(screen.getByRole("button", { name: "Remove new one" }));
    expect(onValueChange).toHaveBeenLastCalledWith([], []);
  });

  it("leaves Enter, arrows, Escape and Backspace to the IME while composing", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <Combobox
        label="City"
        multiple
        options={options}
        defaultValue={["goa"]}
        onValueChange={onValueChange}
      />,
    );
    await user.click(input());
    await user.keyboard("{ArrowDown}");
    const el = input();
    const before = activeOption();
    const composing = { isComposing: true };
    fireEvent.keyDown(el, { key: "ArrowDown", ...composing });
    expect(activeOption()).toBe(before);
    fireEvent.keyDown(el, { key: "Enter", ...composing });
    // Safari ends composition before this keydown and only says so through keyCode 229.
    fireEvent.keyDown(el, { key: "Enter", keyCode: 229 });
    fireEvent.keyDown(el, { key: "Backspace", ...composing });
    fireEvent.keyDown(el, { key: "Escape", ...composing });
    expect(onValueChange).not.toHaveBeenCalled();
    expect(el).toHaveAttribute("aria-expanded", "true");
  });

  it("submits through FormData with name and resets with the form", async () => {
    const user = userEvent.setup();
    render(
      <form aria-label="form">
        <Combobox
          label="City"
          name="city"
          options={options}
          defaultValue="pune"
        />
      </form>,
    );
    const form = screen.getByRole<HTMLFormElement>("form");
    expect(formValues(form)).toEqual({ city: "pune" });
    await user.click(input());
    await user.click(screen.getByRole("option", { name: /Goa/ }));
    expect(formValues(form)).toEqual({ city: "goa" });
    act(() => form.reset());
    expect(input()).toHaveValue("Pune");
    expect(formValues(form)).toEqual({ city: "pune" });
  });

  it("shows a localized message and focuses the input on native required failure", async () => {
    const user = userEvent.setup();
    render(
      <PravaProvider messages={{ valueMissing: "Pflichtfeld" }}>
        <form aria-label="form">
          <Combobox label="City" name="city" required options={options} />
          <button>Save</button>
        </form>
      </PravaProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Pflichtfeld")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveFocus();
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "aria-required",
      "true",
    );
  });

  it("announces a single match in the singular", async () => {
    const user = userEvent.setup();
    render(
      <Combobox label="City" options={[{ value: "pune", label: "Pune" }]} />,
    );
    await user.click(input());
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/^1 result$/),
    );
  });

  it("announces result counts and loading through the provider's messages", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <PravaProvider
        locale="de"
        messages={{
          resultCount: "{count} Treffer",
          loading: "Lädt",
          noResults: "Nichts",
        }}
      >
        <Combobox label="City" options={options} />
      </PravaProvider>,
    );
    const status = screen.getByRole("status");
    expect(status).toBeEmptyDOMElement(); // mounted before there is anything to say
    await user.click(input());
    await waitFor(() => expect(status).toHaveTextContent("4 Treffer"));
    await user.type(input(), "zzz");
    await waitFor(() => expect(status).toHaveTextContent("Nichts"));
    rerender(
      <PravaProvider
        locale="de"
        messages={{
          resultCount: "{count} Treffer",
          loading: "Lädt",
          noResults: "Nichts",
        }}
      >
        <Combobox label="City" options={options} loading />
      </PravaProvider>,
    );
    await waitFor(() => expect(status).toHaveTextContent("Lädt"));
    expect(screen.getByRole("listbox")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status").textContent).toBe("Lädt");
  });

  it("disabled and readOnly stay closed", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Combobox label="City" options={options} disabled />,
    );
    await user.click(input());
    expect(input()).toBeDisabled();
    expect(input()).toHaveAttribute("aria-expanded", "false");
    rerender(<Combobox label="City" options={options} readOnly />);
    await user.click(input());
    await user.keyboard("{ArrowDown}");
    expect(input()).toHaveAttribute("aria-expanded", "false");
  });

  it("outside press closes, and clicking a row keeps focus in the input", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Combobox label="City" options={options} />
        <button>outside</button>
      </>,
    );
    await user.click(input());
    await user.click(screen.getByRole("option", { name: "Pune" }));
    expect(input()).toHaveFocus();
    await user.click(input());
    expect(input()).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("button", { name: "outside" }));
    expect(input()).toHaveAttribute("aria-expanded", "false");
  });

  it("forwards native attributes, className, style and slot classes", async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn((e: React.KeyboardEvent) => e.preventDefault());
    const ref = { current: null as HTMLElement | null };
    const { container } = render(
      <Combobox
        ref={ref as React.Ref<HTMLInputElement>}
        label="City"
        id="own"
        options={options}
        className="mine"
        style={{ maxWidth: 200 }}
        classNames={{ input: "in", popup: "pop", list: "li", option: "op" }}
        data-testid="box"
        onKeyDown={onKeyDown}
      />,
    );
    const el = screen.getByTestId("box");
    expect(el).toBe(input());
    expect(el).toHaveClass("in");
    expect(el.id).toBe("own");
    expect(container.querySelector(".mine")).toHaveStyle({ maxWidth: "200px" });
    await user.click(el);
    expect(container.querySelector(".pop")).toBeTruthy();
    expect(container.querySelector(".li")).toBeTruthy();
    expect(container.querySelector(".op")).toBeTruthy();
    // preventDefault in the consumer's handler opts out of Prava's.
    await user.keyboard("{ArrowDown}");
    expect(el).not.toHaveAttribute("aria-activedescendant");
    // The ref is the form control; focusing it focuses the input, for form libraries.
    ref.current?.focus();
    expect(el).toHaveFocus();
  });

  it("works inside FormField", async () => {
    const user = userEvent.setup();
    render(
      <form aria-label="form">
        <FormField
          label="City"
          required
          description="Where you live"
          control={<Combobox name="city" options={options} />}
        />
        <button>Save</button>
      </form>,
    );
    expect(input(/City/)).toHaveAccessibleDescription("Where you live");
    await user.click(input(/City/));
    expect(screen.getByRole("listbox", { name: /City/ })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Fill in this field.")).toBeInTheDocument();
  });

  it("runs inside RTL providers with a localized remove label", () => {
    render(
      <PravaProvider
        direction="rtl"
        locale="ar"
        messages={{ removeOption: "إزالة {label}" }}
      >
        <Combobox
          label="City"
          multiple
          options={options}
          defaultValue={["goa"]}
        />
      </PravaProvider>,
    );
    expect(
      screen.getByRole("button", { name: "إزالة Goa" }).closest("[dir]"),
    ).toHaveAttribute("dir", "rtl");
  });

  describe("field prop with react-hook-form", () => {
    type Values = { city: string; tags: string[] };
    function Profile({
      onSubmit,
      defaults = { city: "", tags: [] },
      options: opts = options,
    }: {
      onSubmit: (values: Values) => void;
      defaults?: Values;
      options?: typeof options;
    }) {
      const { register, control, handleSubmit, reset, formState } =
        useForm<Values>({ defaultValues: defaults });
      return (
        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <Combobox
            label="City"
            options={opts}
            allowCustomValue
            error={formState.errors.city?.message}
            field={register("city", { required: "Pick a city" })}
          />
          <Controller
            name="tags"
            control={control}
            render={({ field }) => (
              <Combobox
                label="Tags"
                multiple
                allowCustomValue
                options={opts}
                field={field}
              />
            )}
          />
          <button>Save</button>
          <button
            type="button"
            onClick={() => reset({ city: "server-only", tags: ["goa"] })}
          >
            Reset
          </button>
        </form>
      );
    }

    it("validates, focuses, submits and resets through register and Controller", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<Profile onSubmit={onSubmit} />);
      await user.click(screen.getByRole("button", { name: "Save" }));
      expect(await screen.findByText("Pick a city")).toBeInTheDocument();
      expect(input()).toHaveFocus();
      expect(input()).toHaveAttribute("aria-invalid", "true");
      expect(onSubmit).not.toHaveBeenCalled();

      await user.click(input());
      await user.click(screen.getByRole("option", { name: "Pune" }));
      await user.type(input("Tags"), "fresh{Enter}");
      await user.keyboard("{ArrowDown}{Enter}");
      await user.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() =>
        expect(onSubmit.mock.calls[0]?.[0]).toEqual({
          city: "pune",
          tags: ["pune", "fresh"],
        }),
      );
      expect(screen.queryByText("Pick a city")).toBeNull();

      // A value no option holds still survives reset, the case a hidden select would lose.
      await user.click(screen.getByRole("button", { name: "Reset" }));
      expect(input()).toHaveValue("server-only");
      expect(screen.getByRole("button", { name: "Remove Goa" })).toBeVisible();
    });

    it("loads default values into the input", () => {
      render(
        <Profile
          onSubmit={() => {}}
          defaults={{ city: "goa", tags: ["pune"] }}
        />,
      );
      expect(input()).toHaveValue("Goa");
      expect(screen.getByRole("button", { name: "Remove Pune" })).toBeVisible();
    });
  });
});
