import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button";
import { Card, CardContent, CardFooter, CardHeader } from "./Card";

const meta = {
  title: "Display/Card",
  component: Card,
  tags: ["autodocs"],
  subcomponents: { CardHeader, CardContent, CardFooter },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A responsive content surface with optional header, body, and footer parts. Heading level, actions, and semantics stay under consumer control.",
      },
    },
  },
} satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card {...args} style={{ width: "min(100%, 28rem)", ...args.style }}>
      <CardHeader>
        <h2 style={{ margin: 0, fontSize: "1.125rem" }}>Account</h2>
        <p
          style={{
            margin: ".25rem 0 0",
            color: "var(--prava-color-text-muted)",
          }}
        >
          Manage your profile details.
        </p>
      </CardHeader>
      <CardContent>
        <p style={{ margin: 0 }}>
          Your account information and preferences appear here.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline">Cancel</Button>
        <Button>Save changes</Button>
      </CardFooter>
    </Card>
  ),
};

export const ContentOnly: Story = {
  render: (args) => (
    <Card {...args} style={{ width: "min(100%, 28rem)", ...args.style }}>
      <CardContent>Card content can also stand on its own.</CardContent>
    </Card>
  ),
};

export const DarkTheme: Story = {
  render: (args) => (
    <div
      data-prava-theme="dark"
      style={{ background: "var(--prava-color-canvas)", padding: "1rem" }}
    >
      <Card {...args} style={{ width: "min(100%, 28rem)", ...args.style }}>
        <CardContent>Card colors follow the active theme tokens.</CardContent>
      </Card>
    </div>
  ),
};

export const Customized: Story = {
  render: (args) => (
    <Card
      {...args}
      className="custom-card"
      style={{
        width: "min(100%, 28rem)",
        borderColor: "var(--prava-color-primary)",
        ...args.style,
      }}
    >
      <CardContent>
        Use className, style, or shared CSS tokens to customize the card.
      </CardContent>
    </Card>
  ),
};
