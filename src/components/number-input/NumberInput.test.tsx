import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import type { FormEvent } from "react";
import { Controller, useForm } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FormField } from "../form-field";
import { PravaProvider } from "../provider";
import { NumberInput, type NumberInputProps } from "./NumberInput";

afterEach(cleanup);

const field = () => screen.getByRole<HTMLInputElement>("spinbutton");
const button = (name: string) =>
  screen.getByRole<HTMLButtonElement>("button", { name });
const hidden = (container: HTMLElement) =>
  container.querySelector<HTMLInputElement>('input[type="hidden"]')!;

/** Types into a fresh field, blurs, and returns the last value and the text shown. */
async function typed(text: string, locale: string, props?: NumberInputProps) {
  const onValueChange = vi.fn();
  const { unmount } = render(
    <PravaProvider locale={locale}>
      <NumberInput aria-label="n" onValueChange={onValueChange} {...props} />
    </PravaProvider>,
  );
  await userEvent.type(field(), text);
  await userEvent.tab();
  const value = onValueChange.mock.lastCall?.[0] as number | null | undefined;
  const shown = field().value;
  unmount();
  return { value, shown };
}

describe("NumberInput", () => {
  it("exposes spinbutton semantics and forwards ref and native attributes", () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <NumberInput
        ref={ref}
        label="Quantity"
        defaultValue={3}
        min={0}
        max={5}
        data-testid="q"
      />,
    );
    const input = screen.getByRole("spinbutton", { name: "Quantity" });
    expect(ref.current).toBe(input);
    expect(input).toHaveAttribute("aria-valuenow", "3");
    expect(input).toHaveAttribute("aria-valuemin", "0");
    expect(input).toHaveAttribute("aria-valuemax", "5");
    expect(input).toHaveAttribute("aria-valuetext", "3");
    expect(input).toHaveAttribute("data-testid", "q");
    expect(input).toHaveAttribute("inputmode", "decimal");
  });

  it("is empty and null by default, with no aria-valuenow", () => {
    render(<NumberInput aria-label="n" />);
    expect(field()).toHaveValue("");
    expect(field()).not.toHaveAttribute("aria-valuenow");
    expect(field()).toHaveAttribute("inputmode", "text"); // negatives need a minus key
  });

  it("puts className and style on the root and classNames on slots", () => {
    const { container } = render(
      <NumberInput
        aria-label="n"
        className="root"
        style={{ maxWidth: 100 }}
        classNames={{ input: "in", buttons: "group", button: "btn" }}
      />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveClass("prava-number-input", "root");
    expect(root.style.maxWidth).toBe("100px");
    expect(field()).toHaveClass("in");
    expect(container.querySelector(".group")).not.toBeNull();
    expect(button("Increase")).toHaveClass("btn");
  });

  it("keeps partial text while typing and never clamps mid-typing", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <NumberInput
        aria-label="n"
        min={10}
        max={20}
        onValueChange={onValueChange}
      />,
    );
    await user.type(field(), "1");
    expect(field()).toHaveValue("1");
    expect(onValueChange).toHaveBeenLastCalledWith(1);
    await user.clear(field());
    expect(onValueChange).toHaveBeenLastCalledWith(null);
    await user.type(field(), "-");
    expect(field()).toHaveValue("-");
    await user.clear(field());
    await user.type(field(), "1.");
    expect(field()).toHaveValue("1.");
    await user.clear(field());
    await user.type(field(), "250");
    expect(field()).toHaveValue("250");
    expect(onValueChange).toHaveBeenLastCalledWith(250);
    await user.tab();
    expect(field()).toHaveValue("20");
    expect(onValueChange).toHaveBeenLastCalledWith(20);
  });

  it("clamps up on Enter", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <NumberInput
        aria-label="n"
        min={10}
        max={20}
        onValueChange={onValueChange}
      />,
    );
    await user.type(field(), "5{Enter}");
    expect(onValueChange).toHaveBeenLastCalledWith(10);
    expect(field()).toHaveValue("10");
  });

  it("clearing gives null, not 0, and survives blur", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <NumberInput
        aria-label="n"
        defaultValue={4}
        min={1}
        onValueChange={onValueChange}
      />,
    );
    await user.clear(field());
    await user.tab();
    expect(onValueChange).toHaveBeenLastCalledWith(null);
    expect(field()).toHaveValue("");
  });

  it("restores the last value when the text never parsed", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <NumberInput
        aria-label="n"
        defaultValue={12}
        onValueChange={onValueChange}
      />,
    );
    await user.type(field(), "abc");
    expect(field()).toHaveValue("12abc");
    expect(onValueChange).not.toHaveBeenCalled();
    await user.tab();
    expect(field()).toHaveValue("12");
  });

  it("leaves an untouched value alone on blur", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <NumberInput
        aria-label="n"
        value={99}
        max={10}
        onValueChange={onValueChange}
      />,
    );
    await user.click(field());
    await user.tab();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it.each([
    ["1.234,5", "de", 1234.5],
    ["1234,5", "de", 1234.5],
    ["1,234.5", "en", 1234.5],
    ["1 234,5", "fr", 1234.5],
    ["1 234,5", "fr", 1234.5],
    ["1’234.5", "de-CH", 1234.5],
    ["١٢٣٤٫٥", "ar", 1234.5],
    ["١٬٢٣٤٫٥", "ar-EG", 1234.5],
    ["12.5", "ar-EG", 12.5],
    ["۱۲", "fa", 12],
    ["−5", "sv", -5],
    ["-5", "en", -5],
    ["+5", "en", 5],
    [".5", "en", 0.5],
  ])("parses %s in %s", async (text, locale, expected) => {
    expect((await typed(text, locale)).value).toBe(expected);
  });

  it("reformats for the locale on commit", async () => {
    expect((await typed("1234,5", "de")).shown).toBe("1.234,5");
    expect((await typed("1234.5", "ar-EG")).shown).toBe("١٬٢٣٤٫٥");
  });

  it("parses and rounds to formatOptions", async () => {
    const eur = { style: "currency", currency: "EUR" } as const;
    expect(
      await typed("1.234,567 €", "de", { formatOptions: eur }),
    ).toMatchObject({ value: 1234.57 });
    expect(
      await typed("($5.00)", "en", {
        formatOptions: {
          style: "currency",
          currency: "USD",
          currencySign: "accounting",
        },
      }),
    ).toMatchObject({ value: -5 });
    expect(
      await typed("12,5 %", "de", { formatOptions: { style: "percent" } }),
    ).toMatchObject({ value: 0.125 });
    expect(
      await typed("1.1", "en", { formatOptions: { style: "percent" } }),
    ).toMatchObject({ value: 0.011, shown: "1.1%" });
  });

  it("does not round typed values without formatOptions", async () => {
    expect(await typed("1.23456", "en")).toMatchObject({
      value: 1.23456,
      shown: "1.23456",
    });
  });

  it("steps with arrow keys and without floating point artifacts", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <NumberInput
        aria-label="n"
        defaultValue={0.1}
        step={0.1}
        onValueChange={onValueChange}
      />,
    );
    await user.click(field());
    await user.keyboard("{ArrowUp}");
    expect(onValueChange).toHaveBeenLastCalledWith(0.2);
    await user.keyboard("{ArrowUp}");
    expect(onValueChange).toHaveBeenLastCalledWith(0.3);
    expect(field()).toHaveValue("0.3");
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(onValueChange).toHaveBeenLastCalledWith(-0.1);
  });

  it("steps from empty to the nearest limit or 0, and clamps at limits", async () => {
    const user = userEvent.setup();
    render(<NumberInput aria-label="n" min={5} max={6} />);
    await user.click(field());
    await user.keyboard("{ArrowUp}");
    expect(field()).toHaveValue("5");
    await user.keyboard("{ArrowUp}{ArrowUp}{ArrowUp}");
    expect(field()).toHaveValue("6");
    cleanup();
    render(<NumberInput aria-label="n" />);
    await user.click(field());
    await user.keyboard("{ArrowDown}");
    expect(field()).toHaveValue("0");
  });

  it("uses 1% as the default percent step", async () => {
    const user = userEvent.setup();
    render(
      <NumberInput
        aria-label="n"
        defaultValue={0.07}
        formatOptions={{ style: "percent" }}
      />,
    );
    await user.click(field());
    await user.keyboard("{ArrowUp}");
    expect(field()).toHaveValue("8%");
    expect(field()).toHaveAttribute("aria-valuenow", "0.08");
  });

  it("Home and End go to limits, and otherwise still move the caret", async () => {
    const user = userEvent.setup();
    render(<NumberInput aria-label="n" defaultValue={5} min={1} max={9} />);
    await user.click(field());
    await user.keyboard("{Home}");
    expect(field()).toHaveValue("1");
    await user.keyboard("{End}");
    expect(field()).toHaveValue("9");
    cleanup();
    render(<NumberInput aria-label="n" defaultValue={55} />);
    await user.click(field());
    await user.keyboard("{Home}1");
    expect(field()).toHaveValue("155");
  });

  it("leaves PageUp, PageDown, and modified keys to the browser", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <NumberInput
        aria-label="n"
        defaultValue={5}
        min={1}
        onValueChange={onValueChange}
      />,
    );
    await user.click(field());
    await user.keyboard("{PageUp}{PageDown}{Shift>}{Home}{/Shift}");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("buttons step, disable at limits, are not tab stops, and keep focus in the field", async () => {
    const user = userEvent.setup();
    render(<NumberInput aria-label="n" defaultValue={1} min={0} max={2} />);
    expect(button("Increase")).toHaveAttribute("tabindex", "-1");
    expect(button("Decrease")).toHaveAttribute("tabindex", "-1");
    await user.click(field());
    await user.click(button("Increase"));
    expect(field()).toHaveFocus();
    expect(field()).toHaveValue("2");
    expect(button("Increase")).toBeDisabled();
    await user.click(button("Decrease"));
    await user.click(button("Decrease"));
    expect(field()).toHaveValue("0");
    expect(button("Decrease")).toBeDisabled();
    expect(button("Increase")).toBeEnabled();
    await user.tab();
    expect(document.body).toHaveFocus(); // nothing else to tab to
  });

  it("disabled and readOnly do not step", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(
      <NumberInput
        aria-label="n"
        defaultValue={1}
        min={0}
        readOnly
        onValueChange={onValueChange}
      />,
    );
    expect(button("Increase")).toBeDisabled();
    await user.click(field());
    await user.keyboard("{ArrowUp}{Home}5");
    expect(onValueChange).not.toHaveBeenCalled();
    expect(field()).toHaveValue("1");
    rerender(<NumberInput aria-label="n" defaultValue={1} disabled />);
    expect(field()).toBeDisabled();
    expect(button("Decrease")).toBeDisabled();
  });

  it("controlled: follows value and rejects edits the parent ignores", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<NumberInput aria-label="n" value={3} />);
    await user.type(field(), "4");
    expect(field()).toHaveValue("3");
    rerender(<NumberInput aria-label="n" value={null} />);
    expect(field()).toHaveValue("");
  });

  it("controlled: an external change replaces what was being typed", async () => {
    const user = userEvent.setup();
    function Host() {
      const [value, setValue] = useState<number | null>(1);
      return (
        <>
          <NumberInput aria-label="n" value={value} onValueChange={setValue} />
          <button onClick={() => setValue(7)}>seven</button>
        </>
      );
    }
    render(<Host />);
    await user.type(field(), "2x");
    expect(field()).toHaveValue("12x");
    await user.click(screen.getByText("seven"));
    expect(field()).toHaveValue("7");
  });

  it("localizes button names and formats from the provider", () => {
    render(
      <PravaProvider
        locale="de"
        direction="rtl"
        messages={{ increment: "Mehr", decrement: "Weniger" }}
      >
        <NumberInput aria-label="n" defaultValue={1234.5} />
      </PravaProvider>,
    );
    expect(button("Mehr")).toBeEnabled();
    expect(button("Weniger")).toBeEnabled();
    expect(field()).toHaveValue("1.234,5");
    expect(field().closest("[dir]")).toHaveAttribute("dir", "rtl");
  });

  it("associates description and error", () => {
    render(<NumberInput label="n" description="Help" error="Nope" />);
    expect(field()).toHaveAccessibleDescription("Help Nope");
    expect(field()).toHaveAttribute("aria-invalid", "true");
  });

  it("works inside FormField", async () => {
    const user = userEvent.setup();
    render(
      <form>
        <FormField label="Qty" required control={<NumberInput name="qty" />} />
        <button>Go</button>
      </form>,
    );
    const input = screen.getByRole("spinbutton", { name: /Qty/ });
    expect(input).toBeRequired();
    await user.click(screen.getByRole("button", { name: "Go" }));
    expect(input).toHaveAccessibleDescription("Fill in this field.");
  });

  describe("native forms", () => {
    const values = (form: HTMLFormElement) =>
      Object.fromEntries(new FormData(form));

    it("submits plain digits under name, and only the hidden input is named", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <PravaProvider locale="de">
          <form>
            <NumberInput aria-label="n" name="amount" />
          </form>
        </PravaProvider>,
      );
      const form = container.querySelector("form")!;
      expect(values(form)).toEqual({ amount: "" });
      await user.type(field(), "1.234,5");
      expect(values(form)).toEqual({ amount: "1234.5" });
      expect(field()).not.toHaveAttribute("name");
    });

    it("Enter submits the clamped value", async () => {
      const user = userEvent.setup();
      let submitted: unknown;
      render(
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitted = values(event.currentTarget);
          }}
        >
          <NumberInput aria-label="n" name="amount" max={100} />
          <button>Go</button>
        </form>,
      );
      await user.type(field(), "150{Enter}");
      expect(submitted).toEqual({ amount: "100" });
    });

    it("omits the value while disabled, and blocks an empty required field", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn((event: FormEvent) => event.preventDefault());
      const { container } = render(
        <form onSubmit={onSubmit}>
          <NumberInput aria-label="a" name="a" disabled defaultValue={1} />
          <NumberInput aria-label="b" name="b" required />
          <button>Go</button>
        </form>,
      );
      expect(values(container.querySelector("form")!)).toEqual({ b: "" });
      await user.click(screen.getByRole("button", { name: "Go" }));
      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getByRole("spinbutton", { name: "b" })).toHaveFocus();
      expect(screen.getByText("Fill in this field.")).toBeInTheDocument();
    });

    it("form.reset() restores defaultValue and drops typed text", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <form>
          <NumberInput aria-label="n" name="a" defaultValue={2} />
        </form>,
      );
      await user.clear(field());
      await user.type(field(), "9x");
      expect(hidden(container).value).toBe("9");
      container.querySelector("form")!.reset();
      await waitFor(() => expect(field()).toHaveValue("2"));
      expect(hidden(container).value).toBe("2");
    });
  });

  describe("react-hook-form", () => {
    type Values = { qty: number | null };

    function WithRegister({
      onSubmit,
      defaults = { qty: 2 },
    }: {
      onSubmit: (values: Values) => void;
      defaults?: Values;
    }) {
      const { register, handleSubmit, reset, setValue, formState } =
        useForm<Values>({ defaultValues: defaults });
      return (
        <form noValidate onSubmit={handleSubmit((v) => onSubmit(v))}>
          <NumberInput
            aria-label="n"
            field={register("qty", {
              required: "Required!",
              max: { value: 5, message: "Too many" },
            })}
            error={formState.errors.qty?.message}
          />
          <button type="button" onClick={() => reset({ qty: 4 })}>
            Reset
          </button>
          <button type="button" onClick={() => setValue("qty", 3)}>
            Set
          </button>
          <button>Save</button>
        </form>
      );
    }

    function Plain({
      onSubmit,
      defaults,
    }: {
      onSubmit: (values: Values) => void;
      defaults: Values;
    }) {
      const { register, handleSubmit } = useForm<Values>({
        defaultValues: defaults,
      });
      return (
        <form noValidate onSubmit={handleSubmit((v) => onSubmit(v))}>
          <NumberInput aria-label="n" max={10} field={register("qty")} />
          <button>Save</button>
        </form>
      );
    }

    function WithController({
      onSubmit,
      defaults,
    }: {
      onSubmit: (values: Values) => void;
      defaults: Values;
    }) {
      const { control, handleSubmit, reset, setValue } = useForm<Values>({
        defaultValues: defaults,
      });
      return (
        <form noValidate onSubmit={handleSubmit((v) => onSubmit(v))}>
          <Controller
            name="qty"
            control={control}
            rules={{ required: "Required!" }}
            render={({ field: f, fieldState }) => (
              <NumberInput
                aria-label="n"
                max={10}
                field={f}
                error={fieldState.error?.message}
              />
            )}
          />
          <button type="button" onClick={() => reset({ qty: 7 })}>
            Reset
          </button>
          <button type="button" onClick={() => setValue("qty", 3)}>
            Set
          </button>
          <button>Save</button>
        </form>
      );
    }

    const save = () => userEvent.click(button("Save"));

    it("register: an untouched default submits as a number", async () => {
      const onSubmit = vi.fn();
      render(<WithRegister onSubmit={onSubmit} />);
      expect(field()).toHaveValue("2");
      await save();
      await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ qty: 2 }));
    });

    it("register: typed and stepped values reach the form as numbers, after locale parsing", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(
        <PravaProvider locale="de">
          <WithRegister onSubmit={onSubmit} />
        </PravaProvider>,
      );
      await user.clear(field());
      await user.type(field(), "1,5");
      await save();
      await waitFor(() =>
        expect(onSubmit).toHaveBeenLastCalledWith({ qty: 1.5 }),
      );
      await user.click(field());
      await user.keyboard("{ArrowUp}");
      await save();
      await waitFor(() =>
        expect(onSubmit).toHaveBeenLastCalledWith({ qty: 2.5 }),
      );
      await user.click(button("Increase"));
      await save();
      await waitFor(() =>
        expect(onSubmit).toHaveBeenLastCalledWith({ qty: 3.5 }),
      );
    });

    it("register: blur keeps the clamped number, not a string", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<Plain onSubmit={onSubmit} defaults={{ qty: 1 }} />);
      await user.clear(field());
      await user.type(field(), "50");
      await user.tab();
      expect(field()).toHaveValue("10");
      await save();
      await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ qty: 10 }));
    });

    it("register: empty is null, fails required, and focuses the visible field", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<WithRegister onSubmit={onSubmit} />);
      await user.clear(field());
      await save();
      expect(await screen.findByText("Required!")).toBeInTheDocument();
      expect(field()).toHaveFocus();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("register: numeric rules see the number", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<WithRegister onSubmit={onSubmit} />);
      await user.clear(field());
      await user.type(field(), "6");
      await save();
      expect(await screen.findByText("Too many")).toBeInTheDocument();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it("register: reset and setValue update the display and the submitted number", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<WithRegister onSubmit={onSubmit} />);
      await user.click(button("Set"));
      expect(field()).toHaveValue("3");
      await save();
      await waitFor(() =>
        expect(onSubmit).toHaveBeenLastCalledWith({ qty: 3 }),
      );
      await user.click(button("Reset"));
      await waitFor(() => expect(field()).toHaveValue("4"));
      await save();
      await waitFor(() =>
        expect(onSubmit).toHaveBeenLastCalledWith({ qty: 4 }),
      );
    });

    it("register: a null default stays null", async () => {
      const onSubmit = vi.fn();
      render(<Plain onSubmit={onSubmit} defaults={{ qty: null }} />);
      await save();
      await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ qty: null }));
    });

    it("Controller: numbers and null round trip, with reset and setValue", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<WithController onSubmit={onSubmit} defaults={{ qty: null }} />);
      await save();
      expect(await screen.findByText("Required!")).toBeInTheDocument();
      expect(field()).toHaveFocus();
      await user.type(field(), "40");
      await user.tab();
      expect(field()).toHaveValue("10");
      await save();
      await waitFor(() =>
        expect(onSubmit).toHaveBeenLastCalledWith({ qty: 10 }),
      );
      expect(screen.queryByText("Required!")).toBeNull();
      await user.click(button("Set"));
      expect(field()).toHaveValue("3");
      await user.click(button("Reset"));
      await waitFor(() => expect(field()).toHaveValue("7"));
      await user.click(button("Increase"));
      await save();
      await waitFor(() =>
        expect(onSubmit).toHaveBeenLastCalledWith({ qty: 8 }),
      );
    });

    it("Controller: a form default of '' is treated as empty", () => {
      render(
        <WithController
          onSubmit={vi.fn()}
          defaults={{ qty: "" as unknown as null }}
        />,
      );
      expect(field()).toHaveValue("");
    });
  });
});
