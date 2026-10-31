import type { Meta, StoryObj } from "@storybook/react-vite";
import { Separator } from "./Separator";

const meta = {
  title: "Components/Separator",
  component: Separator,
  tags: ["autodocs"],
  args: { orientation: "horizontal", decorative: true },
  parameters: {
    docs: {
      description: {
        component:
          "A quiet boundary between related sections. It is decorative by default; use a semantic separator when the boundary carries meaning.",
      },
    },
  },
} satisfies Meta<typeof Separator>;
export default meta;
type Story = StoryObj<typeof meta>;

export const InSettings: Story = {
  render: (args) => (
    <section
      style={{ width: "min(100%, 28rem)", display: "grid", gap: "1rem" }}
    >
      <div>
        <strong style={{ display: "block", fontSize: "1rem" }}>Profile</strong>
        <span style={{ color: "var(--prava-color-text-muted)" }}>
          Name, email, and public details
        </span>
      </div>
      <Separator {...args} />
      <div>
        <strong style={{ display: "block", fontSize: "1rem" }}>Security</strong>
        <span style={{ color: "var(--prava-color-text-muted)" }}>
          Password and sign-in options
        </span>
      </div>
    </section>
  ),
};

export const Vertical: Story = {
  args: { orientation: "vertical", decorative: false },
  render: (args) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "1rem",
        minHeight: "2.5rem",
      }}
    >
      <span>Updated just now</span>
      <Separator {...args} style={{ alignSelf: "stretch", ...args.style }} />
      <span>All changes saved</span>
    </div>
  ),
};
