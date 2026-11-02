import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "react-hook-form";
import { PravaProvider } from "../provider";
import { Button } from "./Button";

const meta = {
  title: "Actions/Button",
  component: Button,
  tags: ["autodocs"],
  args: { children: "Save changes" },
  argTypes: {
    type: { control: "select", options: ["button", "submit", "reset", "icon"] },
  },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

const PlusIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const ArrowIcon = ({ mirrored = false }: { mirrored?: boolean }) => (
  <svg
    style={mirrored ? { scale: "-1 1" } : undefined}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
const row = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: ".75rem",
} as const;
const variants = [
  "primary",
  "secondary",
  "outline",
  "ghost",
  "destructive",
] as const;

export const Primary: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div style={row}>
      {variants.map((variant) => (
        <Button {...args} key={variant} variant={variant}>
          {variant[0]!.toUpperCase() + variant.slice(1)}
        </Button>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={row}>
      {(["sm", "md", "lg"] as const).map((size) => (
        <Button {...args} key={size} size={size}>
          {size === "sm" ? "Small" : size === "md" ? "Medium" : "Large"}
        </Button>
      ))}
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div style={row}>
      <Button loading>Saving</Button>
      <Button variant="secondary" loading>
        Exporting
      </Button>
      <Button disabled>Disabled</Button>
      <Button variant="secondary" disabled>
        Disabled
      </Button>
    </div>
  ),
};

export const WithIcons: Story = {
  args: { startIcon: <PlusIcon />, children: "New project" },
  render: (args) => (
    <div style={row}>
      <Button {...args} />
      <Button variant="secondary" endIcon={<ArrowIcon />}>
        Continue
      </Button>
    </div>
  ),
};

export const IconOnly: Story = {
  render: () => (
    <div style={row}>
      {(["sm", "md", "lg"] as const).map((size) => (
        <Button
          key={size}
          type="icon"
          size={size}
          aria-label="Add item"
          startIcon={<PlusIcon />}
        />
      ))}
      <Button
        type="icon"
        variant="primary"
        aria-label="Add item"
        startIcon={<PlusIcon />}
      />
    </div>
  ),
};

export const AsLink: Story = {
  render: () => (
    <div style={row}>
      <Button href="#billing" variant="secondary" endIcon={<ArrowIcon />}>
        View billing
      </Button>
      <Button href="#billing" variant="ghost" disabled>
        Unavailable link
      </Button>
    </div>
  ),
};

export const FullWidth: Story = {
  render: () => (
    <div style={{ maxWidth: "22rem", display: "grid", gap: ".75rem" }}>
      <Button fullWidth>Create account</Button>
      <Button fullWidth variant="secondary">
        Sign in with SSO
      </Button>
    </div>
  ),
};

export const DarkTheme: Story = {
  render: () => (
    <PravaProvider theme="dark">
      <div
        style={{
          ...row,
          padding: "1.5rem",
          borderRadius: ".875rem",
          background: "var(--prava-color-canvas)",
        }}
      >
        {variants.map((variant) => (
          <Button key={variant} variant={variant}>
            {variant[0]!.toUpperCase() + variant.slice(1)}
          </Button>
        ))}
      </div>
    </PravaProvider>
  ),
};

export const RTL: Story = {
  render: () => (
    <PravaProvider direction="rtl" locale="ar">
      <div style={row}>
        <Button startIcon={<PlusIcon />}>مشروع جديد</Button>
        {/* Directional icons are mirrored by the consumer; "forward" points left in RTL. */}
        <Button variant="secondary" endIcon={<ArrowIcon mirrored />}>
          متابعة
        </Button>
      </div>
    </PravaProvider>
  ),
};

export const WithoutAnimation: Story = { args: { disableAnimation: true } };

export const Customized: Story = {
  args: {
    className: "custom-button",
    style: { borderRadius: "999px", paddingInline: "1.5rem" },
    children: "Custom style",
  },
};

function SubmittingExample() {
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = useForm();
  return (
    <form
      onSubmit={handleSubmit(
        () => new Promise((done) => setTimeout(done, 1500)),
      )}
    >
      <Button type="submit" loading={isSubmitting}>
        Save
      </Button>
    </form>
  );
}

/** A submit button has no `field`: show react-hook-form's `isSubmitting` with `loading`. */
export const WithReactHookForm: Story = {
  render: () => <SubmittingExample />,
};
