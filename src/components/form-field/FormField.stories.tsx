import type { Meta, StoryObj } from "@storybook/react-vite";
import { Controller } from "react-hook-form";
import { HookFormStory } from "../field/HookFormStory";
import { PravaProvider } from "../provider";
import { Input } from "../input";
import { Textarea } from "../textarea";
import { FormField } from "./FormField";

const meta = {
  title: "Forms/FormField",
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

export const RTL: Story = {
  args: { label: "البريد", control: <Input /> },
  render: () => (
    <PravaProvider direction="rtl" locale="ar" messages={{ required: "مطلوب" }}>
      <div style={{ width: "min(100%, 28rem)" }}>
        <FormField
          label="البريد الإلكتروني"
          required
          description="نستخدمه لتسجيل الدخول."
          error="أدخل بريدًا صالحًا."
          control={<Input type="email" />}
        />
      </div>
    </PravaProvider>
  ),
};

/** Connect with `field={register(name, rules)}` and pass the message to `error`. */
export const WithRegister: Story = {
  args: { label: "Work email", control: <Input /> },
  render: () => (
    <HookFormStory defaultValues={{ email: "" }}>
      {({ register, formState: { errors } }) => (
        <FormField
          label="Work email"
          required
          error={errors.email?.message}
          control={
            <Input
              type="email"
              field={register("email", { required: "Enter your work email." })}
            />
          }
        />
      )}
    </HookFormStory>
  ),
};

/** Inside `Controller`, pass its `field` and `fieldState.error?.message`. */
export const WithController: Story = {
  args: { label: "Work email", control: <Input /> },
  render: () => (
    <HookFormStory defaultValues={{ email: "" }}>
      {({ control }) => (
        <Controller
          name="email"
          control={control}
          rules={{ required: "Enter your work email." }}
          render={({ field, fieldState }) => (
            <FormField
              label="Work email"
              required
              error={fieldState.error?.message}
              control={<Input type="email" field={field} />}
            />
          )}
        />
      )}
    </HookFormStory>
  ),
};
