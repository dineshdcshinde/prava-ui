import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button";
import { PravaProvider } from "../provider";
import { Accordion, AccordionItem } from "./Accordion";

const meta = {
  title: "Navigation/Accordion",
  component: Accordion,
  tags: ["autodocs"],
  subcomponents: { AccordionItem },
  parameters: {
    docs: {
      description: {
        component:
          "Discloses related content. Headers are buttons inside headings; pick `headingLevel` to fit the page. Up and Down, Home and End move between headers. A closed panel is hidden from keyboard and screen readers.",
      },
    },
  },
} satisfies Meta<typeof Accordion>;
export default meta;
type Story = StoryObj<typeof meta>;

const items = (
  <>
    <AccordionItem value="billing" title="When am I billed?">
      Invoices go out on the first of each month, in your workspace's currency.
    </AccordionItem>
    <AccordionItem value="seats" title="Can I change the number of seats?">
      Yes. Changes apply straight away, and the difference shows on your next
      invoice.
    </AccordionItem>
    <AccordionItem value="sso" title="Do you support single sign-on?" disabled>
      Single sign-on is part of the Enterprise plan.
    </AccordionItem>
    <AccordionItem value="export" title="Can I export my data?">
      Any admin can export projects and members as CSV.
      <div style={{ marginTop: "0.75rem" }}>
        <Button size="sm" variant="secondary">
          Start export
        </Button>
      </div>
    </AccordionItem>
  </>
);

export const Default: Story = {
  args: { defaultValue: ["billing"], style: { maxWidth: "36rem" } },
  render: (args) => <Accordion {...args}>{items}</Accordion>,
};

export const Multiple: Story = {
  args: {
    multiple: true,
    defaultValue: ["billing", "seats"],
    style: { maxWidth: "36rem" },
  },
  render: (args) => <Accordion {...args}>{items}</Accordion>,
};

export const LongTitleNarrow: Story = {
  render: () => (
    <Accordion style={{ width: 240 }}>
      <AccordionItem
        value="a"
        title="A long question that needs to wrap onto several lines to fit"
      >
        Long text wraps and the panel keeps its width.
      </AccordionItem>
    </Accordion>
  ),
};

export const RightToLeft: Story = {
  render: () => (
    <PravaProvider direction="rtl" locale="ar">
      <Accordion defaultValue={["a"]} style={{ maxWidth: "36rem" }}>
        <AccordionItem value="a" title="متى تصدر الفواتير؟">
          تصدر الفواتير في أول كل شهر.
        </AccordionItem>
        <AccordionItem value="b" title="هل يمكنني تصدير بياناتي؟">
          نعم، يمكن لأي مسؤول التصدير.
        </AccordionItem>
      </Accordion>
    </PravaProvider>
  ),
};
