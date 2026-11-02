import type { Meta, StoryObj } from "@storybook/react-vite";
import { Progress } from "./Progress";

const meta = {
  title: "Feedback/Progress",
  component: Progress,
  tags: ["autodocs"],
  args: { label: "File upload", value: 64 },
  parameters: {
    docs: {
      description: {
        component:
          "A compact task indicator that supports a clamped numeric range or an indeterminate state. Always name the task for assistive technology.",
      },
    },
  },
} satisfies Meta<typeof Progress>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Uploading: Story = {
  render: (args) => (
    <div style={{ width: "min(100%, 28rem)", display: "grid", gap: ".625rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <strong style={{ fontSize: ".9375rem" }}>Quarterly report.pdf</strong>
        <span
          style={{
            color: "var(--prava-color-text-muted)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {args.value}%
        </span>
      </div>
      <Progress {...args} />
    </div>
  ),
};

export const Preparing: Story = {
  args: { label: "Preparing report", value: undefined },
  render: (args) => (
    <div style={{ width: "min(100%, 28rem)", display: "grid", gap: ".625rem" }}>
      <strong style={{ fontSize: ".9375rem" }}>Preparing your report</strong>
      <Progress {...args} />
    </div>
  ),
};
