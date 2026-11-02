import type { Meta, StoryObj } from "@storybook/react-vite";
import { Controller } from "react-hook-form";
import { HookFormStory } from "../field/HookFormStory";
import { PravaProvider } from "../provider";
import { Switch } from "./Switch";

const meta = {
  title: "Forms/Switch",
  component: Switch,
  tags: ["autodocs"],
  args: { label: "Desktop notifications" },
} satisfies Meta<typeof Switch>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const States: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "1rem", maxWidth: "28rem" }}>
      <Switch label="Off" />
      <Switch label="On" defaultChecked />
      <Switch
        label="Weekly digest"
        description="A summary of activity every Monday."
        defaultChecked
      />
      <Switch label="Disabled" disabled />
      <Switch label="Disabled on" disabled defaultChecked />
    </div>
  ),
};
export const RTL: Story = {
  render: () => (
    <PravaProvider direction="rtl" locale="ar">
      <div style={{ display: "grid", gap: "1rem" }}>
        <Switch label="الإشعارات" />
        <Switch label="الوضع الليلي" defaultChecked />
      </div>
    </PravaProvider>
  ),
};

/** Connect with `field={register(name, rules)}` and pass the message to `error`. */
export const WithRegister: Story = {
  render: () => (
    <HookFormStory defaultValues={{ alerts: false }}>
      {({ register, formState: { errors } }) => (
        <Switch
          label="Security alerts"
          field={register("alerts", {
            required: "Turn on alerts to continue.",
          })}
          error={errors.alerts?.message}
        />
      )}
    </HookFormStory>
  ),
};

/** Inside `Controller`, pass its `field` and `fieldState.error?.message`. */
export const WithController: Story = {
  render: () => (
    <HookFormStory defaultValues={{ alerts: false }}>
      {({ control }) => (
        <Controller
          name="alerts"
          control={control}
          rules={{ required: "Turn on alerts to continue." }}
          render={({ field, fieldState }) => (
            <Switch
              label="Security alerts"
              field={field}
              error={fieldState.error?.message}
            />
          )}
        />
      )}
    </HookFormStory>
  ),
};
