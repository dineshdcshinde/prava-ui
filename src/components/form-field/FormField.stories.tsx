import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "../input";
import { Textarea } from "../textarea";
import { FormField } from "./FormField";

const meta = {
  title: "Components/FormField",
  component: FormField,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Composes a visible label, a native or Prava control, optional guidance, and a validation message with stable IDs and `aria-describedby` associations.",
      },
    },
  },
} satisfies Meta<typeof FormField>;
export default meta;
type Story = StoryObj<typeof meta>;

export const AccountDetails: Story = {
  args: { label: "Account details", control: <Input /> },
  render: () => (
    <div style={{ width: "min(100%, 28rem)", display: "grid", gap: "1.25rem" }}>
      <FormField
        label="Work email"
        required
        description="Used for account updates and sign-in."
        control={<Input type="email" placeholder="name@company.com" />}
      />
      <FormField
        label="About you"
        description="A short introduction for your team."
        control={<Textarea rows={3} placeholder="Write a few sentences" />}
      />
    </div>
  ),
};

export const Invalid: Story = {
  args: { label: "Work email", control: <Input /> },
  render: () => (
    <div style={{ width: "min(100%, 28rem)" }}>
      <FormField
        label="Work email"
        required
        error="Enter a valid email address."
        control={<Input type="email" defaultValue="not-an-email" invalid />}
      />
    </div>
  ),
};
