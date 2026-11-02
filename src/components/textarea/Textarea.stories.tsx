import type { Meta, StoryObj } from "@storybook/react-vite";
import { Controller } from "react-hook-form";
import { HookFormStory } from "../field/HookFormStory";
import { Textarea } from "./Textarea";

const meta = {
  title: "Forms/Textarea",
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

/** Grows with the text from `rows` up to `maxRows`, then scrolls. Type a few lines to see it. */
export const GrowsAsYouType: Story = {
  args: {
    "aria-label": "Note",
    rows: 2,
    maxRows: 6,
    placeholder: "Start typing…",
  },
};

/** Set `maxRows` equal to `rows` for a fixed height. */
export const FixedHeight: Story = {
  args: { "aria-label": "Note", rows: 4, maxRows: 4 },
};

/** The drag handle is off by default; `resize` opts back in. */
export const WithDragHandle: Story = {
  args: { "aria-label": "Note", resize: "vertical" },
};

/** Connect with `field={register(name, rules)}` and pass the message to `error`. */
export const WithRegister: Story = {
  render: () => (
    <HookFormStory defaultValues={{ bio: "" }}>
      {({ register, formState: { errors } }) => (
        <Textarea
          aria-label="About you"
          rows={3}
          field={register("bio", { required: "Tell us about yourself." })}
          error={errors.bio?.message}
        />
      )}
    </HookFormStory>
  ),
};

/** Inside `Controller`, pass its `field` and `fieldState.error?.message`. */
export const WithController: Story = {
  render: () => (
    <HookFormStory defaultValues={{ bio: "" }}>
      {({ control }) => (
        <Controller
          name="bio"
          control={control}
          rules={{ required: "Tell us about yourself." }}
          render={({ field, fieldState }) => (
            <Textarea
              aria-label="About you"
              rows={3}
              field={field}
              error={fieldState.error?.message}
            />
          )}
        />
      )}
    </HookFormStory>
  ),
};
