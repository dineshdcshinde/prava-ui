import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button";
import { Checkbox } from "../checkbox";
import { PravaProvider } from "../provider";
import { Drawer, DrawerClose } from "./Drawer";

const meta = {
  title: "Overlays/Drawer",
  component: Drawer,
  tags: ["autodocs"],
  args: {
    title: "Filters",
    description: "Narrow the list of projects.",
    trigger: <Button variant="secondary">Filters</Button>,
    footer: (
      <DrawerClose>
        <Button>Apply filters</Button>
      </DrawerClose>
    ),
    children: (
      <div style={{ display: "grid", gap: "0.75rem" }}>
        <Checkbox label="Active" defaultChecked />
        <Checkbox label="Archived" />
        <Checkbox label="Shared with me" />
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        component:
          "A Dialog anchored to a screen edge, with the same props, focus, and dismissal rules. `start` and `end` follow the text direction; side drawers always leave a strip of page to press.",
      },
    },
  },
} satisfies Meta<typeof Drawer>;
export default meta;
type Story = StoryObj<typeof meta>;

export const End: Story = {};
export const Start: Story = { args: { placement: "start" } };
export const Bottom: Story = { args: { placement: "bottom" } };
export const Top: Story = { args: { placement: "top" } };
export const NonModal: Story = { args: { modal: false } };

export const RightToLeft: Story = {
  render: () => (
    <PravaProvider direction="rtl" locale="ar" messages={{ close: "إغلاق" }}>
      <Drawer
        trigger={<Button variant="secondary">عوامل التصفية</Button>}
        title="عوامل التصفية"
        footer={
          <DrawerClose>
            <Button>تطبيق</Button>
          </DrawerClose>
        }
      >
        <Checkbox label="نشط" defaultChecked />
      </Drawer>
    </PravaProvider>
  ),
};
