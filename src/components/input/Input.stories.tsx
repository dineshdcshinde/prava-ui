import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./Input";

const meta = {
  title: "Components/Input",
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
        leftIcon={<SearchIcon />}
      />
      <Input
        {...args}
        label="Trailing icon"
        type="search"
        rightIcon={<SearchIcon />}
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
