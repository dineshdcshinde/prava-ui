import type { Meta, StoryObj } from "@storybook/react-vite";
import { Controller } from "react-hook-form";
import { HookFormStory } from "../field/HookFormStory";
import { PravaProvider } from "../provider";
import { Checkbox } from "./Checkbox";

const meta = {
  title: "Forms/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  args: { label: "Email me product updates" },
} satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const States: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "1rem", maxWidth: "28rem" }}>
      <Checkbox label="Unchecked" />
      <Checkbox label="Checked" defaultChecked />
      <Checkbox label="Some selected" indeterminate />
      <Checkbox
        label="With help text"
        description="We send at most one email a month."
      />
      <Checkbox
        label="I accept the terms"
        error="Accept the terms to continue."
      />
      <Checkbox label="Disabled" disabled />
      <Checkbox label="Disabled and checked" disabled defaultChecked />
    </div>
  ),
};
export const RTL: Story = {
  render: () => (
    <PravaProvider direction="rtl" locale="ar">
      <Checkbox
        label="أرسل لي التحديثات"
        description="مرة واحدة في الشهر."
        defaultChecked
      />
    </PravaProvider>
  ),
};

/** Connect with `field={register(name, rules)}` and pass the message to `error`. */
export const WithRegister: Story = {
  render: () => (
    <HookFormStory defaultValues={{ terms: false }}>
      {({ register, formState: { errors } }) => (
        <Checkbox
          label="I accept the terms"
          field={register("terms", {
            required: "Accept the terms to continue.",
          })}
          error={errors.terms?.message}
        />
      )}
    </HookFormStory>
  ),
};

/** Inside `Controller`, pass its `field` and `fieldState.error?.message`. */
export const WithController: Story = {
  render: () => (
    <HookFormStory defaultValues={{ terms: false }}>
      {({ control }) => (
        <Controller
          name="terms"
          control={control}
          rules={{ required: "Accept the terms to continue." }}
          render={({ field, fieldState }) => (
            <Checkbox
              label="I accept the terms"
              field={field}
              error={fieldState.error?.message}
            />
          )}
        />
      )}
    </HookFormStory>
  ),
};
