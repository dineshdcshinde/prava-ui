import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button";
import { Card, CardContent } from "../card";
import { Input } from "../input";
import { PravaProvider } from "../provider";
import { Popover } from "./Popover";

const meta = {
  title: "Overlays/Popover",
  component: Popover,
  tags: ["autodocs"],
  args: {
    trigger: <Button variant="secondary">Share</Button>,
    title: "Share this project",
    children: <Input label="Link" readOnly defaultValue="prava.dev/p/atlas" />,
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Floating content anchored to a trigger. It flips and stays on screen when space runs out, and escapes clipping parents through the top layer. Focus moves in on open and returns to the trigger on Escape; a press outside or tabbing away closes it. It has no focus trap, so use Dialog when a task must be finished first.",
      },
    },
  },
} satisfies Meta<typeof Popover>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Placements: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      {(["top", "bottom", "start", "end"] as const).map((placement) => (
        <Popover
          key={placement}
          placement={placement}
          aria-label={placement}
          trigger={<Button variant="outline">{placement}</Button>}
        >
          Opens on the {placement} side.
        </Popover>
      ))}
    </div>
  ),
};

export const InsideCard: Story = {
  render: (args) => (
    <Card style={{ width: "16rem", overflow: "hidden" }}>
      <CardContent>
        <Popover {...args} />
      </CardContent>
    </Card>
  ),
};

export const RightToLeft: Story = {
  render: () => (
    <PravaProvider direction="rtl" locale="ar">
      <Popover
        placement="end"
        title="مشاركة المشروع"
        trigger={<Button variant="secondary">مشاركة</Button>}
      >
        يفتح في الجهة المناسبة لاتجاه النص.
      </Popover>
    </PravaProvider>
  ),
};
