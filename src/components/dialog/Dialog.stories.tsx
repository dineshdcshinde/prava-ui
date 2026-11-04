import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../button";
import { Input } from "../input";
import { PravaProvider } from "../provider";
import { Select } from "../select";
import { Dialog, DialogClose } from "./Dialog";

const meta = {
  title: "Overlays/Dialog",
  component: Dialog,
  tags: ["autodocs"],
  args: {
    title: "Invite a teammate",
    description: "They get an email with a link to join this workspace.",
    trigger: <Button>Invite</Button>,
  },
  parameters: {
    docs: {
      description: {
        component:
          "A native `<dialog>`. Modal dialogs trap focus, block the page, and return focus to what opened them. Escape and a press on the backdrop close it unless `dismissible` is off. Focus lands on the first focusable child; mark another with `data-autofocus`.",
      },
    },
  },
} satisfies Meta<typeof Dialog>;
export default meta;
type Story = StoryObj<typeof meta>;

const footer = (
  <>
    <DialogClose>
      <Button variant="outline">Cancel</Button>
    </DialogClose>
    <DialogClose>
      <Button>Send invite</Button>
    </DialogClose>
  </>
);

export const Default: Story = {
  args: {
    footer,
    children: (
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <Input label="Work email" type="email" />
        <Select
          label="Role"
          placeholder="Choose a role"
          options={[
            { value: "admin", label: "Admin" },
            { value: "member", label: "Member" },
          ]}
        />
      </div>
    ),
  },
};

export const RequiredChoice: Story = {
  args: {
    role: "alertdialog",
    size: "sm",
    title: "Delete this project?",
    description: "Its files and history are removed for everyone.",
    trigger: <Button variant="destructive">Delete project</Button>,
    dismissible: false,
    hideClose: true,
    footer: (
      <>
        <DialogClose>
          <Button variant="outline" data-autofocus>
            Keep project
          </Button>
        </DialogClose>
        <DialogClose>
          <Button variant="destructive">Delete</Button>
        </DialogClose>
      </>
    ),
  },
};

export const LongContent: Story = {
  args: {
    title: "Terms of service",
    footer,
    children: Array.from({ length: 14 }, (_, index) => (
      <p key={index}>
        Section {index + 1}. Only this region scrolls, so the title and the
        actions stay in view on any screen height.
      </p>
    )),
  },
};

export const NonModal: Story = {
  args: {
    modal: false,
    title: "Keyboard shortcuts",
    description: "The page behind stays usable while this is open.",
    size: "sm",
  },
};

export const Controlled: Story = {
  render: function Render(args) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Open from elsewhere</Button>
        <Dialog
          {...args}
          trigger={undefined}
          open={open}
          onOpenChange={setOpen}
          footer={footer}
        >
          Your own state decides when this shows.
        </Dialog>
      </>
    );
  },
};

export const RightToLeft: Story = {
  render: () => (
    <PravaProvider direction="rtl" locale="ar" messages={{ close: "إغلاق" }}>
      <Dialog
        trigger={<Button>دعوة</Button>}
        title="دعوة زميل"
        description="سيصله بريد إلكتروني برابط للانضمام."
        footer={
          <DialogClose>
            <Button>إرسال</Button>
          </DialogClose>
        }
      >
        <Input label="البريد الإلكتروني" type="email" />
      </Dialog>
    </PravaProvider>
  ),
};
