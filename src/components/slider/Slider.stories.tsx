import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type CSSProperties } from "react";
import { Controller } from "react-hook-form";
import { Button } from "../button";
import { HookFormStory } from "../field/HookFormStory";
import { PravaProvider } from "../provider";
import { Slider, type SliderProps } from "./Slider";

const meta = {
  title: "Forms/Slider",
  component: Slider,
  tags: ["autodocs"],
  args: { label: "Volume", defaultValue: 40, showValue: true },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "28rem", padding: ".75rem" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<SliderProps>;
export default meta;
type Story = StoryObj<SliderProps>;

const stack = { display: "grid", gap: "1.5rem" };

export const Default: Story = {};
export const Range: Story = {
  args: { label: "Price", defaultValue: [20, 80], step: 5 },
};
export const Steps: Story = {
  args: { label: "Opacity", min: 0, max: 1, step: 0.1, defaultValue: 0.3 },
};
export const States: Story = {
  render: () => (
    <div style={stack}>
      <Slider label="Disabled" defaultValue={40} showValue disabled />
      <Slider
        label="Disabled range"
        defaultValue={[20, 60]}
        showValue
        disabled
      />
      <Slider
        label="With help"
        defaultValue={40}
        description="Applies to every device."
      />
      <Slider
        label="With error"
        defaultValue={90}
        error="Keep this under 80."
      />
    </div>
  ),
};
function ControlledSlider() {
  const [value, setValue] = useState(30);
  return (
    <div style={stack}>
      <Slider label="Level" value={value} onValueChange={setValue} showValue />
      <Button variant="secondary" onClick={() => setValue(0)}>
        Reset to 0
      </Button>
    </div>
  );
}
export const Controlled: Story = { render: () => <ControlledSlider /> };

function NativeFormDemo() {
  const [sent, setSent] = useState<string>();
  return (
    <form
      style={stack}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        setSent(
          JSON.stringify({
            volume: data.get("volume"),
            price: data.getAll("price"),
          }),
        );
      }}
    >
      <Slider label="Volume" name="volume" defaultValue={40} />
      <Slider label="Price" name="price" defaultValue={[20, 80]} />
      <div style={{ display: "flex", gap: ".5rem" }}>
        <Button type="submit">Save</Button>
        <Button type="reset" variant="ghost">
          Reset
        </Button>
      </div>
      {sent && <output>{sent}</output>}
    </form>
  );
}
export const NativeForm: Story = { render: () => <NativeFormDemo /> };

export const ReactHookForm: Story = {
  render: () => (
    <HookFormStory
      defaultValues={{ volume: 40, price: [20, 80] as [number, number] }}
    >
      {({ register, control }) => (
        <>
          <Slider
            label="Volume"
            showValue
            field={register("volume", { valueAsNumber: true })}
          />
          <Controller
            name="price"
            control={control}
            render={({ field }) => (
              <Slider label="Price" showValue field={field} />
            )}
          />
        </>
      )}
    </HookFormStory>
  ),
};
export const RTL: Story = {
  render: () => (
    <PravaProvider
      direction="rtl"
      locale="ar-EG"
      messages={{ minimumValue: "الأدنى", maximumValue: "الأقصى" }}
    >
      <div style={stack}>
        <Slider label="الصوت" defaultValue={25} showValue />
        <Slider label="السعر" defaultValue={[20, 60]} showValue />
      </div>
    </PravaProvider>
  ),
};
export const Customized: Story = {
  args: {
    label: "Brand",
    className: "my-slider",
    style: {
      maxInlineSize: "16rem",
      "--prava-color-primary": "var(--prava-color-on-success)",
    } as CSSProperties,
  },
};
