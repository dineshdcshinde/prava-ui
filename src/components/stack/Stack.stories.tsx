import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "../badge";
import { Button } from "../button";
import { Input } from "../input";
import { Stack } from "./Stack";

const meta = {
  title: "Layout/Stack",
  component: Stack,
  tags: ["autodocs"],
  args: { gap: 3 },
  parameters: {
    docs: {
      description: {
        component:
          "Arranges children in a row or column with a consistent gap. Children are not wrapped, so their semantics stay intact.",
      },
    },
  },
} satisfies Meta<typeof Stack>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Vertical: Story = {
  render: (args) => (
    <Stack {...args} style={{ maxWidth: "24rem" }}>
      <Input label="Full name" />
      <Input label="Work email" type="email" />
      <Button>Save changes</Button>
    </Stack>
  ),
};

export const Horizontal: Story = {
  args: { orientation: "horizontal" },
  render: (args) => (
    <Stack {...args}>
      <Button>Save changes</Button>
      <Button variant="outline">Cancel</Button>
    </Stack>
  ),
};

export const SpaceBetween: Story = {
  args: { orientation: "horizontal", justify: "between" },
  render: (args) => (
    <Stack {...args} style={{ maxWidth: "24rem" }}>
      <span>Storage</span>
      <Badge tone="warning" content="92% used" />
    </Stack>
  ),
};

export const Wrapping: Story = {
  args: { orientation: "horizontal", wrap: true, gap: 2 },
  render: (args) => (
    <Stack {...args} style={{ width: 240 }}>
      {["Design", "Engineering", "Marketing", "Support", "Sales"].map((tag) => (
        <Badge key={tag} content={tag} />
      ))}
    </Stack>
  ),
};

export const AsList: Story = {
  args: { as: "ul", gap: 1 },
  render: (args) => (
    <Stack {...args} style={{ margin: 0, paddingInlineStart: "1.25rem" }}>
      <li>Children keep their list semantics</li>
      <li>Because Stack adds no wrappers</li>
    </Stack>
  ),
};
