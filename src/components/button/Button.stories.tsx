import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  args: { children: "Save changes" },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Variants: Story = {
  render: (args) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: ".5rem" }}>
      {(
        ["primary", "secondary", "outline", "ghost", "destructive"] as const
      ).map((variant) => (
        <Button {...args} key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
};
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
      {(["sm", "md", "lg"] as const).map((size) => (
        <Button {...args} key={size} size={size}>
          {size}
        </Button>
      ))}
    </div>
  ),
};
export const Loading: Story = { args: { loading: true } };
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const WithIcons: Story = {
  args: { leftIcon: <PlusIcon />, rightIcon: <PlusIcon />, children: "Add item" },
};
export const IconOnly: Story = {
  args: { type: "icon", "aria-label": "Add item", leftIcon: <PlusIcon />, children: undefined },
};
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl">
      <Button {...args}>حفظ التغييرات</Button>
    </div>
  ),
};
export const Customized: Story = {
  args: {
    className: "custom-button",
    style: { borderRadius: "999px", paddingInline: "1.5rem" },
    children: "Custom style",
  },
};
