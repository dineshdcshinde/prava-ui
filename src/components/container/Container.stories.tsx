import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";
import { Container } from "./Container";

const meta = {
  title: "Layout/Container",
  component: Container,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Centers content with a responsive inline gutter. Pick a `size`, use `fluid` for no limit, or set `--prava-container-max` for a custom width.",
      },
    },
  },
} satisfies Meta<typeof Container>;
export default meta;
type Story = StoryObj<typeof meta>;

const fill = {
  background: "var(--prava-color-primary-container)",
  color: "var(--prava-color-on-primary-container)",
  padding: "1rem",
  borderRadius: "var(--prava-radius-control)",
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "1rem", paddingBlock: "1rem" }}>
      {(["sm", "md", "lg", "xl", "fluid"] as const).map((size) => (
        <Container key={size} size={size}>
          <div style={fill}>{size}</div>
        </Container>
      ))}
    </div>
  ),
};

export const CustomWidth: Story = {
  render: () => (
    <Container style={{ "--prava-container-max": "30rem" } as CSSProperties}>
      <div style={fill}>--prava-container-max: 30rem</div>
    </Container>
  ),
};
