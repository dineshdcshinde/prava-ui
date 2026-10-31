import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "../input";
import { Label } from "./Label";

const meta = {
  title: "Components/Label",
  component: Label,
  tags: ["autodocs"],
  args: { htmlFor: "display-name", children: "Display name" },
  parameters: {
    docs: {
      description: {
        component:
          "Pair with a native form control through `htmlFor`. Required controls receive a visible, readable “Required” cue.",
      },
    },
  },
} satisfies Meta<typeof Label>;
export default meta;
type Story = StoryObj<typeof meta>;

export const RequiredField: Story = {
  args: { required: true },
  render: (args) => (
    <div style={{ width: "min(100%, 24rem)", display: "grid", gap: ".5rem" }}>
      <Label {...args} />
      <Input id="display-name" />
    </div>
  ),
};
