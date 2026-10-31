import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "./Skeleton";

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
  tags: ["autodocs"],
  args: { shape: "rect" },
  parameters: {
    docs: {
      description: {
        component:
          "Reserve the dimensions of content that is temporarily unavailable. Use a small composition of shapes to match the real layout and avoid page shift.",
      },
    },
  },
} satisfies Meta<typeof Skeleton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ProfileLoading: Story = {
  render: (args) => (
    <div
      style={{
        width: "min(100%, 28rem)",
        display: "grid",
        gridTemplateColumns: "2.75rem 1fr",
        alignItems: "center",
        gap: ".875rem",
      }}
    >
      <Skeleton
        {...args}
        shape="circle"
        style={{ width: "2.75rem", ...args.style }}
      />
      <div style={{ display: "grid", gap: ".5rem" }}>
        <Skeleton
          {...args}
          shape="text"
          style={{ width: "45%", height: ".9rem", ...args.style }}
        />
        <Skeleton
          {...args}
          shape="text"
          style={{ width: "72%", height: ".75rem", ...args.style }}
        />
      </div>
    </div>
  ),
};

export const ContentLoading: Story = {
  render: (args) => (
    <div style={{ width: "min(100%, 28rem)", display: "grid", gap: ".75rem" }}>
      <Skeleton
        {...args}
        shape="rect"
        style={{ height: "8rem", ...args.style }}
      />
      <Skeleton
        {...args}
        shape="text"
        style={{ width: "82%", height: ".9rem", ...args.style }}
      />
      <Skeleton
        {...args}
        shape="text"
        style={{ width: "58%", height: ".9rem", ...args.style }}
      />
    </div>
  ),
};
