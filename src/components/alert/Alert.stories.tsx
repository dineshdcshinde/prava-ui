import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../button";
import { PravaProvider } from "../provider";
import { Alert } from "./Alert";

const meta = {
  title: "Feedback/Alert",
  component: Alert,
  tags: ["autodocs"],
  args: {
    tone: "info",
    title: "Maintenance on Sunday",
    children: "Exports pause from 02:00 to 03:00 UTC.",
  },
  parameters: {
    docs: {
      description: {
        component:
          'Contextual feedback that stays until the page removes it. It announces politely as `role="status"`; pass `role="alert"` only when the message must interrupt.',
      },
    },
  },
} satisfies Meta<typeof Alert>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Tones: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "0.75rem", maxWidth: "36rem" }}>
      <Alert title="Draft saved">Only you can see this version.</Alert>
      <Alert tone="info" title="Maintenance on Sunday">
        Exports pause from 02:00 to 03:00 UTC.
      </Alert>
      <Alert tone="success" title="Invitation sent">
        Priya will get an email in a few minutes.
      </Alert>
      <Alert tone="warning" title="Storage almost full">
        You have used 92% of your plan.
      </Alert>
      <Alert tone="danger" title="Payment failed">
        Update your card to keep your plan active.
      </Alert>
    </div>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Alert
      tone="warning"
      title="Storage almost full"
      action={
        <Button size="sm" variant="secondary">
          Upgrade
        </Button>
      }
      style={{ maxWidth: "36rem" }}
    >
      You have used 92% of your plan.
    </Alert>
  ),
};

export const Dismissible: Story = {
  render: function Render() {
    const [open, setOpen] = useState(true);
    return open ? (
      <Alert
        tone="success"
        title="Invitation sent"
        onDismiss={() => setOpen(false)}
        style={{ maxWidth: "36rem" }}
      >
        Priya will get an email in a few minutes.
      </Alert>
    ) : (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Show again
      </Button>
    );
  },
};

export const LongTextNarrow: Story = {
  render: () => (
    <div style={{ width: 280 }}>
      <Alert
        tone="danger"
        title="We could not process your last payment"
        action={<Button size="sm">Update card</Button>}
        onDismiss={() => {}}
      >
        Your plan stays active for seven more days. Update the card on file to
        avoid losing access to your workspace.
      </Alert>
    </div>
  ),
};

export const RightToLeft: Story = {
  render: () => (
    <PravaProvider direction="rtl" locale="ar" messages={{ dismiss: "إغلاق" }}>
      <Alert
        tone="info"
        title="صيانة يوم الأحد"
        onDismiss={() => {}}
        style={{ maxWidth: "36rem" }}
      >
        تتوقف عمليات التصدير من الساعة 02:00 إلى 03:00.
      </Alert>
    </PravaProvider>
  ),
};

export const Customized: Story = {
  args: { className: "custom-alert", style: { borderRadius: 0 } },
};
