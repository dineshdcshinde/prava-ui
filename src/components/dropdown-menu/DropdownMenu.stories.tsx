import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../button";
import { Dialog, DialogClose } from "../dialog";
import { PravaProvider } from "../provider";
import { DropdownMenu } from "./DropdownMenu";

const icon = (path: string) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={path} />
  </svg>
);
const pencil = icon(
  "M3 13l.75-3L10.5 3.25a1 1 0 0 1 1.5 0l.75.75a1 1 0 0 1 0 1.5L6 12.25z",
);
const copy = icon("M5.5 5.5h8v8h-8zM2.5 10.5v-8h8");
const box = icon("M2.5 3.5h11v3h-11zM3.5 6.5v6h9v-6M6.5 9h3");
const trash = icon("M3 4.5h10M6.5 4.5v-2h3v2M4.5 4.5l.5 9h6l.5-9");

const meta = {
  title: "Overlays/DropdownMenu",
  component: DropdownMenu,
  tags: ["autodocs"],
  args: {
    trigger: <Button variant="outline">Actions</Button>,
    items: [
      { label: "Rename", icon: pencil },
      { label: "Duplicate", icon: copy },
      { label: "Archive", icon: box, disabled: true },
      { separator: true },
      { label: "Delete", icon: trash, tone: "danger" },
    ],
  },
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A list of actions, following the WAI-ARIA menu button pattern. Enter, Space, and the arrow keys open it; arrows, Home, End, and typing move through it; Escape closes it and returns focus. Disabled items stay reachable so people can discover them. To choose a value, use Select.",
      },
    },
  },
} satisfies Meta<typeof DropdownMenu>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Groups: Story = {
  args: {
    items: [
      {
        label: "Project",
        items: [{ label: "Rename" }, { label: "Duplicate" }],
      },
      {
        label: "Links",
        items: [
          { label: "Documentation", href: "#docs" },
          { label: "Changelog", href: "#changelog" },
        ],
      },
    ],
  },
};

export const OpensADialog: Story = {
  render: function Render(args) {
    const [confirming, setConfirming] = useState(false);
    return (
      <>
        <DropdownMenu
          {...args}
          items={[
            { label: "Rename" },
            {
              label: "Delete",
              tone: "danger",
              onSelect: () => setConfirming(true),
            },
          ]}
        />
        <Dialog
          open={confirming}
          onOpenChange={setConfirming}
          size="sm"
          title="Delete this project?"
          footer={
            <DialogClose>
              <Button variant="destructive">Delete</Button>
            </DialogClose>
          }
        />
      </>
    );
  },
};

export const LongListNarrow: Story = {
  args: {
    items: Array.from({ length: 30 }, (_, index) => ({
      label: `Workspace number ${index + 1}`,
    })),
  },
};

export const RightToLeft: Story = {
  render: () => (
    <PravaProvider direction="rtl" locale="ar">
      <DropdownMenu
        trigger={<Button variant="outline">إجراءات</Button>}
        items={[
          { label: "إعادة تسمية", icon: pencil },
          { separator: true },
          { label: "حذف", icon: trash, tone: "danger" },
        ]}
      />
    </PravaProvider>
  ),
};
