import type { Meta, StoryObj } from "@storybook/react-vite";
import { Controller } from "react-hook-form";
import { HookFormStory } from "../field/HookFormStory";
import { Input } from "./Input";

const meta = {
  title: "Forms/Input",
  component: Input,
  tags: ["autodocs"],
  args: {
    label: "Email address",
    type: "email",
    placeholder: "Enter your email",
  },
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
    invalid: { control: "boolean" },
    disabled: { control: "boolean" },
    disabledReason: { control: "text" },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "min(100%, 24rem)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: ".75rem" }}>
      {(["sm", "md", "lg"] as const).map((size) => (
        <Input {...args} key={size} size={size} label={`${size} input`} />
      ))}
    </div>
  ),
};
export const Invalid: Story = {
  args: { invalid: true, label: "Invalid input" },
};
export const Disabled: Story = {
  args: {
    disabled: true,
    disabledReason: "Contact an administrator to update this field.",
    label: "Disabled input",
  },
};
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m16 16 5 5" />
  </svg>
);
export const WithIcons: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: ".75rem" }}>
      <Input
        {...args}
        label="Leading icon"
        type="search"
        startIcon={<SearchIcon />}
      />
      <Input
        {...args}
        label="Trailing icon"
        type="search"
        endIcon={<SearchIcon />}
      />
    </div>
  ),
};
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl">
      <Input
        {...args}
        label="البريد الإلكتروني"
        placeholder="أدخل بريدك الإلكتروني"
      />
    </div>
  ),
};
export const Customized: Story = {
  args: {
    className: "custom-input",
    style: { borderRadius: "999px", paddingInline: "1.25rem" },
    label: "Custom input",
  },
};

/** Connect with `field={register(name, rules)}` and pass the message to `error`. */
export const WithRegister: Story = {
  render: () => (
    <HookFormStory defaultValues={{ email: "" }}>
      {({ register, formState: { errors } }) => (
        <Input
          label="Email"
          type="email"
          field={register("email", { required: "Enter your email." })}
          error={errors.email?.message}
        />
      )}
    </HookFormStory>
  ),
};

/** Inside `Controller`, pass its `field` and `fieldState.error?.message`. */
export const WithController: Story = {
  render: () => (
    <HookFormStory defaultValues={{ email: "" }}>
      {({ control }) => (
        <Controller
          name="email"
          control={control}
          rules={{ required: "Enter your email." }}
          render={({ field, fieldState }) => (
            <Input
              label="Email"
              type="email"
              field={field}
              error={fieldState.error?.message}
            />
          )}
        />
      )}
    </HookFormStory>
  ),
};
