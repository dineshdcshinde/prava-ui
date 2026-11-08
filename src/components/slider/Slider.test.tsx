import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Controller, useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { FormField } from "../form-field";
import { PravaProvider } from "../provider";
import { Slider } from "./Slider";

const slider = (name = "Volume") =>
  screen.getByRole<HTMLInputElement>("slider", { name });
const move = (el: HTMLElement, value: number) =>
  fireEvent.change(el, { target: { value: String(value) } });

describe("Slider", () => {
  it("is a labelled native range input with the scale's defaults", () => {
    render(<Slider label="Volume" />);
    const el = slider();
    expect(el.type).toBe("range");
    expect(el).toHaveAttribute("min", "0");
    expect(el).toHaveAttribute("max", "100");
    expect(el).toHaveAttribute("step", "1");
    expect(el.value).toBe("50");
  });

  it("runs uncontrolled and reports numbers", () => {
    const onValueChange = vi.fn();
    render(
      <Slider
        label="Volume"
        defaultValue={40}
        showValue
        onValueChange={(v) => onValueChange(v.toFixed(0))}
      />,
    );
    move(slider(), 55);
    expect(onValueChange).toHaveBeenCalledWith("55");
    expect(screen.getByText("55")).toBeInTheDocument();
  });

  it("holds a controlled value until the parent changes it", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <Slider label="Volume" value={40} onValueChange={onValueChange} />,
    );
    move(slider(), 70);
    expect(onValueChange).toHaveBeenCalledWith(70);
    expect(slider().value).toBe("40");
    rerender(<Slider label="Volume" value={70} />);
    expect(slider().value).toBe("70");
  });

  it.each([
    [150, 100],
    [-5, 0],
    [42, 40],
    [45, 50],
  ])("shows %s on a 0-100 scale of tens as %s", (given, shown) => {
    render(<Slider label="Volume" value={given} step={10} showValue />);
    expect(slider().value).toBe(String(shown));
    expect(screen.getByText(String(shown))).toBeInTheDocument();
  });

  it("keeps fractional steps free of float noise and under a max off the grid", () => {
    const { rerender } = render(
      <Slider
        label="Volume"
        min={0}
        max={1}
        step={0.1}
        value={0.3}
        showValue
      />,
    );
    expect(screen.getByText("0.3")).toBeInTheDocument();
    rerender(<Slider label="Volume" min={0} max={10} step={3} value={10} />);
    expect(slider().value).toBe("9");
  });

  it("formats showValue and the announced value for the provider's locale", () => {
    render(
      <PravaProvider locale="de">
        <Slider label="Volume" max={5000} defaultValue={1234} showValue />
      </PravaProvider>,
    );
    expect(screen.getByText("1.234")).toBeInTheDocument();
    expect(slider()).toHaveAttribute("aria-valuetext", "1.234");
    expect(slider().value).toBe("1234");
  });

  it("disables every thumb", () => {
    const { container } = render(
      <Slider label="Price" defaultValue={[20, 80]} disabled />,
    );
    expect(slider("Price Minimum")).toBeDisabled();
    expect(slider("Price Maximum")).toBeDisabled();
    expect(container.firstChild).toHaveAttribute("data-disabled", "true");
  });

  it("links help and error text and marks it invalid", () => {
    render(<Slider label="Volume" description="Help" error="Too loud" />);
    expect(slider()).toHaveAccessibleDescription("Help Too loud");
    expect(slider()).toHaveAttribute("aria-invalid", "true");
  });

  it("forwards native attributes, ref, className and style to the documented elements", () => {
    const ref = vi.fn();
    const onFocus = vi.fn();
    const { container } = render(
      <Slider
        ref={ref}
        label="Volume"
        className="mine"
        style={{ color: "red" }}
        data-testid="input"
        onFocus={onFocus}
      />,
    );
    expect(container.firstChild).toHaveClass("prava-slider", "mine");
    expect(container.firstChild).toHaveStyle({ color: "red" });
    expect(ref).toHaveBeenCalledWith(screen.getByTestId("input"));
    fireEvent.focus(slider());
    expect(onFocus).toHaveBeenCalled();
  });

  it("takes its name from aria-label without a visible label", () => {
    render(
      <>
        <Slider aria-label="Volume" />
        <Slider aria-label="Price" defaultValue={[1, 2]} />
      </>,
    );
    expect(slider()).toBeInTheDocument();
    expect(slider("Price Minimum")).toBeInTheDocument();
  });

  it("works inside FormField", () => {
    render(<FormField label="Volume" error="Bad" control={<Slider />} />);
    expect(slider()).toHaveAttribute("aria-invalid", "true");
    expect(slider()).toHaveAccessibleDescription("Bad");
  });

  it("uses the subtree's direction without setting its own", () => {
    render(
      <PravaProvider direction="rtl">
        <Slider label="Volume" />
      </PravaProvider>,
    );
    expect(slider().closest("[dir]")).toHaveAttribute("dir", "rtl");
  });

  describe("range", () => {
    it("names each thumb, with provider messages", () => {
      render(
        <PravaProvider messages={{ minimumValue: "Min", maximumValue: "Max" }}>
          <Slider label="Price" defaultValue={[20, 80]} />
        </PravaProvider>,
      );
      expect(slider("Price Min").value).toBe("20");
      expect(slider("Price Max").value).toBe("80");
    });

    it("stops a thumb at the other instead of crossing", () => {
      const onValueChange = vi.fn();
      render(
        <Slider
          label="Price"
          defaultValue={[20, 80]}
          showValue
          onValueChange={onValueChange}
        />,
      );
      move(slider("Price Minimum"), 90);
      expect(onValueChange).toHaveBeenLastCalledWith([80, 80]);
      expect(slider("Price Minimum").value).toBe("80");
      onValueChange.mockClear();
      move(slider("Price Maximum"), 10);
      expect(slider("Price Maximum").value).toBe("80");
      expect(onValueChange).not.toHaveBeenCalled();
      expect(screen.getByText("80 – 80")).toBeInTheDocument();
    });

    it("sorts and clamps a controlled pair", () => {
      render(<Slider label="Price" value={[120, -5]} />);
      expect(slider("Price Minimum").value).toBe("0");
      expect(slider("Price Maximum").value).toBe("100");
    });

    it("lifts the low thumb only when both sit at the far end", () => {
      const { rerender } = render(<Slider label="Price" value={[50, 50]} />);
      expect(slider("Price Minimum")).not.toHaveAttribute("data-top");
      rerender(<Slider label="Price" value={[100, 100]} />);
      expect(slider("Price Minimum")).toHaveAttribute("data-top", "true");
    });

    it.each([
      ["ltr", 300, "Price Minimum", [20, 80], [40, 80]],
      ["ltr", 650, "Price Maximum", [20, 80], [20, 80]],
      ["ltr", 730, "Price Maximum", [20, 80], [20, 90]],
    ] as const)(
      "%s: a press on the track at %ipx moves %s",
      (direction, clientX, name, start, expected) => {
        const onValueChange = vi.fn();
        const { container } = render(
          <PravaProvider direction={direction}>
            <Slider
              label="Price"
              defaultValue={start}
              step={10}
              onValueChange={onValueChange}
            />
          </PravaProvider>,
        );
        const control = container.querySelector<HTMLElement>(
          ".prava-slider__control",
        )!;
        control.getBoundingClientRect = () =>
          ({ left: 0, width: 824, height: 24 }) as DOMRect;
        fireEvent.pointerDown(control);
        fireEvent.click(control, { clientX });
        if (start[0] === expected[0] && start[1] === expected[1])
          expect(onValueChange).not.toHaveBeenCalled();
        else expect(onValueChange).toHaveBeenCalledWith(expected);
        expect(slider(name)).toHaveFocus();
      },
    );

    it("ignores a click that ended a thumb drag", () => {
      const onValueChange = vi.fn();
      const { container } = render(
        <Slider
          label="Price"
          defaultValue={[20, 80]}
          onValueChange={onValueChange}
        />,
      );
      const control = container.querySelector<HTMLElement>(
        ".prava-slider__control",
      )!;
      fireEvent.pointerDown(slider("Price Minimum"));
      fireEvent.click(control, { clientX: 5 });
      expect(onValueChange).not.toHaveBeenCalled();
    });
  });

  describe("forms", () => {
    it("submits one entry, or two for a range, and restores on reset", async () => {
      const user = userEvent.setup();
      let data: FormData | undefined;
      render(
        <form
          onSubmit={(event) => {
            event.preventDefault();
            data = new FormData(event.currentTarget);
          }}
        >
          <Slider label="Volume" name="volume" defaultValue={40} showValue />
          <Slider label="Price" name="price" defaultValue={[20, 80]} />
          <button>Save</button>
          <button type="reset">Reset</button>
        </form>,
      );
      move(slider(), 60);
      move(slider("Price Maximum"), 70);
      await user.click(screen.getByRole("button", { name: "Save" }));
      expect(data?.get("volume")).toBe("60");
      expect(data?.getAll("price")).toEqual(["20", "70"]);
      await user.click(screen.getByRole("button", { name: "Reset" }));
      await waitFor(() => expect(slider().value).toBe("40"));
      expect(screen.getByText("40")).toBeInTheDocument();
      expect(slider("Price Maximum").value).toBe("80");
    });

    type Values = { volume: number; level: number; price: [number, number] };

    function HookForm({ onSubmit }: { onSubmit: (values: Values) => void }) {
      const { register, control, handleSubmit, reset, setValue } =
        useForm<Values>({
          defaultValues: { volume: 40, level: 10, price: [20, 80] },
        });
      return (
        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <Slider
            label="Volume"
            showValue
            field={register("volume", { valueAsNumber: true })}
          />
          <Controller
            name="level"
            control={control}
            render={({ field }) => <Slider label="Level" field={field} />}
          />
          <Controller
            name="price"
            control={control}
            render={({ field }) => <Slider label="Price" field={field} />}
          />
          <button>Save</button>
          <button
            type="button"
            onClick={() => reset({ volume: 5, level: 6, price: [7, 8] })}
          >
            Load
          </button>
          <button type="button" onClick={() => setValue("volume", 77)}>
            Set
          </button>
        </form>
      );
    }

    it("round-trips react-hook-form's register and Controller, with numbers", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<HookForm onSubmit={onSubmit} />);
      expect(slider().value).toBe("40");
      expect(screen.getByText("40")).toBeInTheDocument();
      expect(slider("Price Maximum").value).toBe("80");

      move(slider(), 45);
      move(slider("Level"), 15);
      move(slider("Price Minimum"), 30);
      fireEvent.blur(slider("Price Minimum"));
      await user.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
      expect(onSubmit.mock.calls[0]![0]).toEqual({
        volume: 45,
        level: 15,
        price: [30, 80],
      });
    });

    it("follows react-hook-form's reset and setValue", async () => {
      const user = userEvent.setup();
      render(<HookForm onSubmit={vi.fn()} />);
      await user.click(screen.getByRole("button", { name: "Set" }));
      await waitFor(() => expect(screen.getByText("77")).toBeInTheDocument());
      await user.click(screen.getByRole("button", { name: "Load" }));
      await waitFor(() => expect(slider().value).toBe("5"));
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(slider("Level").value).toBe("6");
      expect(slider("Price Minimum").value).toBe("7");
      expect(slider("Price Maximum").value).toBe("8");
    });

    it("keeps register's pair through change and blur on a range", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      function Form() {
        const { register, handleSubmit } = useForm<Pick<Values, "price">>();
        return (
          <form noValidate onSubmit={handleSubmit(onSubmit)}>
            <Slider
              label="Price"
              defaultValue={[20, 80]}
              field={register("price")}
            />
            <button>Save</button>
          </form>
        );
      }
      render(<Form />);
      move(slider("Price Maximum"), 70);
      fireEvent.blur(slider("Price Maximum"));
      await user.click(screen.getByRole("button", { name: "Save" }));
      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
      expect(onSubmit.mock.calls[0]![0]).toEqual({ price: [20, 70] });
    });

    it("calls the control's own handler alongside field's", () => {
      const onChange = vi.fn();
      const fieldChange = vi.fn();
      render(
        <Slider
          label="Volume"
          onChange={onChange}
          field={{ name: "volume", onChange: fieldChange }}
        />,
      );
      move(slider(), 60);
      expect(onChange).toHaveBeenCalled();
      expect(fieldChange).toHaveBeenCalled();
      expect(slider()).toHaveAttribute("name", "volume");
    });
  });
});
