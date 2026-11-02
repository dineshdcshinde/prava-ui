import type { Meta, StoryObj } from "@storybook/react-vite";
import { Controller } from "react-hook-form";
import { HookFormStory } from "../field/HookFormStory";
import { PravaProvider } from "../provider";
import { RadioGroup } from "./RadioGroup";

const options = [
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro — $12 per seat" },
  { value: "enterprise", label: "Enterprise", disabled: true },
];

const meta = {
  title: "Forms/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
  args: { label: "Plan", options, defaultValue: "pro" },
} satisfies Meta<typeof RadioGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Horizontal: Story = { args: { orientation: "horizontal" } };
export const WithMessages: Story = {
  args: {
    required: true,
    defaultValue: undefined,
    description: "You can change plans at any time.",
    error: "Choose a plan to continue.",
  },
};
export const RTL: Story = {
  render: () => (
    <PravaProvider direction="rtl" locale="ar" messages={{ required: "مطلوب" }}>
      <RadioGroup
        label="الخطة"
        required
        defaultValue="pro"
        options={[
          { value: "free", label: "مجانية" },
          { value: "pro", label: "احترافية" },
        ]}
      />
    </PravaProvider>
  ),
};

/** Connect with `field={register(name, rules)}` and pass the message to `error`. */
export const WithRegister: Story = {
  render: () => (
    <HookFormStory defaultValues={{ plan: "" }}>
      {({ register, formState: { errors } }) => (
        <RadioGroup
          label="Plan"
          options={options}
          field={register("plan", { required: "Choose a plan." })}
          error={errors.plan?.message}
        />
      )}
    </HookFormStory>
  ),
};

/** Inside `Controller`, pass its `field` and `fieldState.error?.message`. */
export const WithController: Story = {
  render: () => (
    <HookFormStory defaultValues={{ plan: "" }}>
      {({ control }) => (
        <Controller
          name="plan"
          control={control}
          rules={{ required: "Choose a plan." }}
          render={({ field, fieldState }) => (
            <RadioGroup
              label="Plan"
              options={options}
              field={field}
              error={fieldState.error?.message}
            />
          )}
        />
      )}
    </HookFormStory>
  ),
};
