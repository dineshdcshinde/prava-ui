import type { Meta, StoryObj } from "@storybook/react-vite";
import { useRef, useState, type CSSProperties } from "react";
import { PravaProvider } from "../provider";
import { Tag } from "./Tag";

const meta = {
  title: "Display/Tag",
  component: Tag,
  tags: ["autodocs"],
  args: { children: "Design" },
} satisfies Meta<typeof Tag>;
export default meta;
type Story = StoryObj<typeof meta>;

const row = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: ".5rem",
} as const;
const tones = [
  "neutral",
  "primary",
  "success",
  "warning",
  "danger",
  "info",
] as const;

const Star = () => (
  <svg viewBox="0 0 16 16" fill="currentColor">
    <path d="M8 1.5l2 4.2 4.6.6-3.4 3.2.9 4.5L8 11.8 3.9 14l.9-4.5L1.4 6.3 6 5.7z" />
  </svg>
);

export const Default: Story = {
  render: (args) => (
    <div style={row}>
      <Tag {...args} />
      <Tag {...args} onRemove={() => {}}>
        Research
      </Tag>
      <Tag {...args} selected onSelectedChange={() => {}}>
        Writing
      </Tag>
      <Tag {...args} selected={false} onSelectedChange={() => {}}>
        Editing
      </Tag>
    </div>
  ),
};

export const Tones: Story = {
  render: (args) => (
    <div style={row}>
      {tones.map((tone) => (
        <Tag {...args} key={tone} tone={tone}>
          {tone}
        </Tag>
      ))}
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div style={row}>
      {(["sm", "md"] as const).map((size) => (
        <Tag
          {...args}
          key={size}
          size={size}
          icon={<Star />}
          onRemove={() => {}}
        >
          {size}
        </Tag>
      ))}
    </div>
  ),
};

/** The consumer removes the tag and moves focus, here to the group, so keyboard users keep their place. */
export const Removable: Story = {
  render: function Render() {
    const [topics, setTopics] = useState(["Design", "Research", "Writing"]);
    const group = useRef<HTMLDivElement>(null);
    return (
      <div
        ref={group}
        role="group"
        aria-label="Topics"
        tabIndex={-1}
        style={row}
      >
        {topics.map((topic) => (
          <Tag
            key={topic}
            onRemove={() => {
              setTopics(topics.filter((t) => t !== topic));
              group.current?.focus();
            }}
          >
            {topic}
          </Tag>
        ))}
      </div>
    );
  },
};

/** The ring fills with a check when selected, so state never relies on color. */
export const Selectable: Story = {
  render: function Render() {
    const [selected, setSelected] = useState<string[]>(["primary"]);
    return (
      <div style={row}>
        {tones.map((tone) => (
          <Tag
            key={tone}
            tone={tone}
            selected={selected.includes(tone)}
            onSelectedChange={(next) =>
              setSelected(
                next ? [...selected, tone] : selected.filter((t) => t !== tone),
              )
            }
          >
            {tone}
          </Tag>
        ))}
      </div>
    );
  },
};

export const SelectableAndRemovable: Story = {
  render: function Render() {
    const [selected, setSelected] = useState(true);
    const [removed, setRemoved] = useState(false);
    return removed ? (
      <button type="button" onClick={() => setRemoved(false)}>
        Restore
      </button>
    ) : (
      <Tag
        selected={selected}
        onSelectedChange={setSelected}
        onRemove={() => setRemoved(true)}
      >
        Design
      </Tag>
    );
  },
};

export const LongText: Story = {
  render: () => (
    <div style={{ maxWidth: "12rem" }}>
      <Tag onRemove={() => {}}>
        A very long tag label that has to truncate inside its container
      </Tag>
    </div>
  ),
};

export const RTL: Story = {
  render: function Render() {
    const [selected, setSelected] = useState(true);
    return (
      <PravaProvider
        direction="rtl"
        locale="ar"
        messages={{ removeTag: "إزالة {label}" }}
      >
        <div style={row}>
          <Tag icon={<Star />}>تصميم</Tag>
          <Tag onRemove={() => {}}>بحث</Tag>
          <Tag
            selected={selected}
            onSelectedChange={setSelected}
            onRemove={() => {}}
          >
            كتابة
          </Tag>
        </div>
      </PravaProvider>
    );
  },
};

export const Customized: Story = {
  args: {
    className: "custom-tag",
    style: {
      "--prava-tag-bg": "var(--prava-color-surface-sunken)",
      "--prava-tag-fg": "var(--prava-color-text-muted)",
    } as CSSProperties,
  },
};
