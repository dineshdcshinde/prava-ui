import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button";
import { PravaProvider } from "../provider";
import { Tooltip } from "./Tooltip";

const meta = {
  title: "Overlays/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  args: {
    content: "Visible to your whole team",
    children: <Button variant="secondary">Publish</Button>,
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Short supplementary text. It shows on hover, keyboard focus, or tap, hides on Escape, and stays open while hovered so it can be read or zoomed. The trigger must be focusable and keep its own accessible name. Keep essential information on the page itself.",
      },
    },
  },
} satisfies Meta<typeof Tooltip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const IconButton: Story = {
  render: () => (
    <Tooltip content="Archive project">
      <Button type="icon" variant="ghost" aria-label="Archive project">
        <svg
          viewBox="0 0 16 16"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 3.5h11v3h-11zM3.5 6.5v6h9v-6M6.5 9h3" />
        </svg>
      </Button>
    </Tooltip>
  ),
};

export const Placements: Story = {
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      {(["top", "bottom", "start", "end"] as const).map((placement) => (
        <Tooltip
          key={placement}
          content={`Shown on the ${placement} side`}
          placement={placement}
          delay={0}
        >
          <Button variant="outline">{placement}</Button>
        </Tooltip>
      ))}
    </div>
  ),
};

export const LongText: Story = {
  args: {
    content:
      "Long text wraps inside a readable width and never runs past the edge of the screen.",
  },
};

export const RightToLeft: Story = {
  render: () => (
    <PravaProvider direction="rtl" locale="ar">
      <Tooltip content="مرئي لفريقك بالكامل" placement="end" delay={0}>
        <Button variant="secondary">نشر</Button>
      </Tooltip>
    </PravaProvider>
  ),
};
