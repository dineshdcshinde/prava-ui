import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button";
import { PravaProvider } from "../provider";
import { dismissToast, toast, Toaster } from "./Toast";

const meta = {
  title: "Feedback/Toast",
  component: Toaster,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Transient feedback. Place one `<Toaster />` near the app root and call `toast()` from anywhere. Timers pause while a toast is hovered or focused, and while the tab is hidden. `danger` toasts stay until dismissed and announce at once; everything else announces politely.",
      },
    },
  },
} satisfies Meta<typeof Toaster>;
export default meta;
type Story = StoryObj<typeof meta>;

const row = { display: "flex", flexWrap: "wrap", gap: "0.5rem" } as const;

export const Default: Story = {
  render: (args) => (
    <div style={row}>
      <Toaster {...args} />
      <Button
        variant="secondary"
        onClick={() => toast({ title: "Draft saved" })}
      >
        Neutral
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            tone: "success",
            title: "Invitation sent",
            description: "Priya will get an email in a few minutes.",
          })
        }
      >
        Success
      </Button>
      <Button
        variant="secondary"
        onClick={() =>
          toast({
            tone: "danger",
            title: "Payment failed",
            description: "Update your card to keep your plan active.",
          })
        }
      >
        Danger (stays)
      </Button>
      <Button variant="ghost" onClick={() => dismissToast()}>
        Dismiss all
      </Button>
    </div>
  ),
};

export const WithAction: Story = {
  render: (args) => (
    <>
      <Toaster {...args} />
      <Button
        variant="secondary"
        onClick={() => {
          const id = toast({
            title: "Project archived",
            action: (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => dismissToast(id)}
              >
                Undo
              </Button>
            ),
          });
        }}
      >
        Archive project
      </Button>
    </>
  ),
};

export const UpdateInPlace: Story = {
  render: (args) => (
    <>
      <Toaster {...args} />
      <Button
        variant="secondary"
        onClick={() => {
          toast({ id: "save", title: "Saving…", duration: Infinity });
          setTimeout(
            () => toast({ id: "save", tone: "success", title: "Saved" }),
            1200,
          );
        }}
      >
        Save
      </Button>
    </>
  ),
};

export const Placements: Story = {
  render: () => (
    <div style={row}>
      {(
        [
          "top-start",
          "top-center",
          "top-end",
          "bottom-start",
          "bottom-center",
          "bottom-end",
        ] as const
      ).map((placement) => (
        <Button
          key={placement}
          variant="outline"
          onClick={() =>
            document
              .querySelector(".prava-toaster")
              ?.setAttribute("data-placement", placement)
          }
        >
          {placement}
        </Button>
      ))}
      <Button onClick={() => toast({ title: "Here I am" })}>Show toast</Button>
      <Toaster />
    </div>
  ),
};

export const RightToLeft: Story = {
  render: () => (
    <PravaProvider
      direction="rtl"
      locale="ar"
      messages={{ dismiss: "إغلاق", notifications: "الإشعارات" }}
    >
      <Toaster />
      <Button
        variant="secondary"
        onClick={() => toast({ tone: "success", title: "تم إرسال الدعوة" })}
      >
        إرسال
      </Button>
    </PravaProvider>
  ),
};
