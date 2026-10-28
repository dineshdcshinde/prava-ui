import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./Badge";
import { Button } from "../button";

const meta = {
  title: "Components/Badge",
  component: Badge,
  args: { content: "3", children: <Button>Inbox</Button> },
} satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Tones: Story = {
  render: (args) => (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "2rem",
        padding: ".75rem",
      }}
    >
      {(
        ["neutral", "primary", "success", "warning", "danger", "info"] as const
      ).map((tone) => (
        <Badge {...args} key={tone} tone={tone} content="3" />
      ))}
    </div>
  ),
};
export const Sizes: Story = {
  render: (args) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "2rem",
        padding: ".75rem",
      }}
    >
      {(["sm", "md"] as const).map((size) => (
        <Badge {...args} key={size} size={size} content="3" />
      ))}
    </div>
  ),
};
export const Placements: Story = {
  render: (args) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "2rem", padding: "1rem" }}>
      {(["top-right", "top-left", "bottom-right", "bottom-left"] as const).map((placement) => (
        <Badge {...args} key={placement} placement={placement} content={placement}>
          <Button>Inbox</Button>
        </Badge>
      ))}
    </div>
  ),
};
export const RTL: Story = {
  render: (args) => (
    <div dir="rtl">
      <Badge {...args} content="٣">
        <Button>الرسائل</Button>
      </Badge>
    </div>
  ),
};
export const Customized: Story = {
  args: {
    className: "custom-badge",
    style: { color: "inherit" },
    content: "New",
    children: <Button>Updates</Button>,
  },
};
