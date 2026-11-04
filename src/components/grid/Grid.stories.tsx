import type { Meta, StoryObj } from "@storybook/react-vite";
import { Card, CardContent } from "../card";
import { Grid } from "./Grid";

const meta = {
  title: "Layout/Grid",
  component: Grid,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A responsive CSS grid with no breakpoints to set. Columns drop on their own when each would be narrower than `minColumnWidth`, down to one.",
      },
    },
  },
} satisfies Meta<typeof Grid>;
export default meta;
type Story = StoryObj<typeof meta>;

const cards = (count: number) =>
  Array.from({ length: count }, (_, index) => (
    <Card key={index}>
      <CardContent>Project {index + 1}</CardContent>
    </Card>
  ));

export const AutoFit: Story = {
  render: (args) => <Grid {...args}>{cards(5)}</Grid>,
};

export const ThreeColumns: Story = {
  args: { columns: 3 },
  render: (args) => <Grid {...args}>{cards(7)}</Grid>,
};

export const CustomMinimum: Story = {
  args: { columns: 4, minColumnWidth: "6rem", gap: 2 },
  render: (args) => <Grid {...args}>{cards(8)}</Grid>,
};

export const NarrowContainer: Story = {
  args: { columns: 3 },
  render: (args) => (
    <div style={{ width: 280 }}>
      <Grid {...args}>{cards(3)}</Grid>
    </div>
  ),
};
