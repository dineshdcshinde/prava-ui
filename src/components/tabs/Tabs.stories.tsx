import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "../input";
import { PravaProvider } from "../provider";
import { Tab, TabList, TabPanel, Tabs } from "./Tabs";
import type { TabsProps } from "./Tabs";

const meta = {
  title: "Navigation/Tabs",
  component: Tabs,
  tags: ["autodocs"],
  subcomponents: { TabList, Tab, TabPanel },
  parameters: {
    docs: {
      description: {
        component:
          "Switches between related panels. Left and right arrows move between tabs (mirrored in RTL), up and down when vertical; Home and End jump. `automatic` selects as focus moves, and `manual` waits for Enter or Space. Tabs scroll instead of wrapping, and inactive panels stay mounted so they keep their state.",
      },
    },
  },
} satisfies Meta<typeof Tabs>;
export default meta;
type Story = StoryObj<TabsProps>;

const parts = (
  <>
    <TabList aria-label="Workspace settings">
      <Tab value="general">General</Tab>
      <Tab value="members">Members</Tab>
      <Tab value="billing">Billing</Tab>
      <Tab value="audit" disabled>
        Audit log
      </Tab>
    </TabList>
    <TabPanel value="general">
      <Input label="Workspace name" defaultValue="Atlas" />
    </TabPanel>
    <TabPanel value="members">Twelve people have access.</TabPanel>
    <TabPanel value="billing">You are on the Pro plan.</TabPanel>
    <TabPanel value="audit">Available on Enterprise.</TabPanel>
  </>
);

export const Default: Story = {
  render: () => <Tabs defaultValue="general">{parts}</Tabs>,
};

export const ManualActivation: Story = {
  render: () => (
    <Tabs defaultValue="general" activation="manual">
      {parts}
    </Tabs>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Tabs defaultValue="general" orientation="vertical">
      {parts}
    </Tabs>
  ),
};

export const ScrollsWhenNarrow: Story = {
  render: () => (
    <div style={{ width: 280 }}>
      <Tabs defaultValue="one">
        <TabList aria-label="Reports">
          {["One", "Two", "Three", "Four", "Five", "Six", "Seven"].map(
            (name) => (
              <Tab key={name} value={name.toLowerCase()}>
                Report {name}
              </Tab>
            ),
          )}
        </TabList>
        {["one", "two", "three", "four", "five", "six", "seven"].map((name) => (
          <TabPanel key={name} value={name}>
            Report {name}
          </TabPanel>
        ))}
      </Tabs>
    </div>
  ),
};

export const RightToLeft: Story = {
  render: () => (
    <PravaProvider direction="rtl" locale="ar">
      <Tabs defaultValue="a">
        <TabList aria-label="الإعدادات">
          <Tab value="a">عام</Tab>
          <Tab value="b">الأعضاء</Tab>
          <Tab value="c">الفوترة</Tab>
        </TabList>
        <TabPanel value="a">الإعدادات العامة</TabPanel>
        <TabPanel value="b">الأعضاء</TabPanel>
        <TabPanel value="c">الفوترة</TabPanel>
      </Tabs>
    </PravaProvider>
  ),
};
