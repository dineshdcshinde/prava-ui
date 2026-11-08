import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Controller } from "react-hook-form";
import { Button } from "../button";
import { HookFormStory } from "../field/HookFormStory";
import { PravaProvider } from "../provider";
import { NumberInput, type NumberInputProps } from "./NumberInput";

const meta = {
  title: "Forms/NumberInput",
  component: NumberInput,
  tags: ["autodocs"],
  args: { label: "Quantity", defaultValue: 1, min: 0, max: 10 },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
    invalid: { control: "boolean" },
    disabled: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "min(100%, 24rem)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NumberInput>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: ".75rem" }}>
      {(["sm", "md", "lg"] as const).map((size) => (
        <NumberInput {...args} key={size} size={size} label={`${size} input`} />
      ))}
    </div>
  ),
};
export const States: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: ".75rem" }}>
      <NumberInput {...args} label="At its limit" defaultValue={10} />
      <NumberInput {...args} label="Empty is null" defaultValue={null} />
      <NumberInput {...args} label="Read only" readOnly />
      <NumberInput
        {...args}
        label="Disabled"
        disabled
        disabledReason="Contact an administrator to update this field."
      />
      <NumberInput
        {...args}
        label="With an error"
        error="Enter a whole number."
      />
      <NumberInput
        {...args}
        label="With a description"
        description="Up to 10 per order."
      />
    </div>
  ),
};
export const Formats: Story = {
  render: () => (
    <div style={{ display: "grid", gap: ".75rem" }}>
      <NumberInput
        label="Price"
        defaultValue={1234.5}
        step={0.5}
        formatOptions={{ style: "currency", currency: "EUR" }}
      />
      <NumberInput
        label="Discount"
        defaultValue={0.15}
        min={0}
        max={1}
        formatOptions={{ style: "percent" }}
      />
      <NumberInput label="Fraction" defaultValue={0.1} step={0.1} />
    </div>
  ),
};

function WithValue(props: NumberInputProps) {
  const [value, setValue] = useState<number | null>(1234.5);
  return (
    <>
      <NumberInput {...props} value={value} onValueChange={setValue} />
      <output style={{ display: "block", marginBlockStart: ".5rem" }}>
        Value: {JSON.stringify(value)}
      </output>
    </>
  );
}

/** German separators: type `1.234,5`. The value is still the number 1234.5. */
export const German: Story = {
  render: () => (
    <PravaProvider locale="de">
      <WithValue label="Betrag" />
    </PravaProvider>
  ),
};
export const RTL: Story = {
  render: () => (
    <PravaProvider
      direction="rtl"
      locale="ar-EG"
      messages={{ increment: "زيادة", decrement: "إنقاص" }}
    >
      <WithValue label="الكمية" />
    </PravaProvider>
  ),
};
export const Customized: Story = {
  args: {
    className: "custom-number-input",
    classNames: { input: "custom-number-input__input" },
    style: { maxWidth: "12rem" },
    label: "Custom input",
  },
};

function NativeFormDemo() {
  const [submitted, setSubmitted] = useState<string>();
  return (
    <PravaProvider locale="de">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(
            JSON.stringify(
              Object.fromEntries(new FormData(event.currentTarget)),
            ),
          );
        }}
        style={{ display: "grid", gap: "1rem" }}
      >
        <NumberInput label="Betrag" name="amount" max={2000} required />
        <div style={{ display: "flex", gap: ".5rem" }}>
          <Button type="submit">Save</Button>
          <Button type="reset" variant="ghost">
            Reset
          </Button>
        </div>
        {submitted && <output>Submitted: {submitted}</output>}
      </form>
    </PravaProvider>
  );
}

/** Without a form library the field submits plain digits under its `name`, in every locale. */
export const NativeForm: Story = { render: () => <NativeFormDemo /> };

/** `field={register(name, rules)}` gives the form a number or `null`. Spreading `register` would give it text. */
export const WithRegister: Story = {
  render: () => (
    <HookFormStory defaultValues={{ quantity: 2 as number | null }}>
      {({ register, formState: { errors } }) => (
        <NumberInput
          label="Quantity"
          min={0}
          max={10}
          field={register("quantity", { required: "Enter a quantity." })}
          error={errors.quantity?.message}
        />
      )}
    </HookFormStory>
  ),
};

/** Inside `Controller`, pass its `field` and `fieldState.error?.message`. */
export const WithController: Story = {
  render: () => (
    <HookFormStory defaultValues={{ quantity: null as number | null }}>
      {({ control }) => (
        <Controller
          name="quantity"
          control={control}
          rules={{ required: "Enter a quantity." }}
          render={({ field, fieldState }) => (
            <NumberInput
              label="Quantity"
              field={field}
              error={fieldState.error?.message}
            />
          )}
        />
      )}
    </HookFormStory>
  ),
};
