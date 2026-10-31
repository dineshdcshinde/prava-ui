import type { Meta, StoryObj } from "@storybook/react-vite";
import { Textarea } from "./Textarea";

const meta = {
  title: "Components/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  args: { rows: 4, placeholder: "Add a note for your team" },
  parameters: {
    docs: {
      description: {
        component:
          "A native multiline field. Its height follows `rows`; resizing is vertical by default and can be disabled explicitly.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "min(100%, 28rem)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Textarea>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Note: Story = {
  args: {
    "aria-label": "Note",
    defaultValue: "Keep the first screen clear and useful.",
  },
};
export const Invalid: Story = { args: { "aria-label": "Note", invalid: true } };
