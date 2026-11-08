import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button";
import { PravaProvider } from "../provider";
import { EmptyState } from "./EmptyState";

const icon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 13h5l2 3h4l2-3h5M5.5 5h13L21 13v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5z" />
  </svg>
);

const meta = {
  title: "Feedback/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  args: {
    icon,
    title: "No invoices yet",
    description: "Invoices appear here after your first payment.",
    action: <Button>Add a payment method</Button>,
  },
  parameters: {
    docs: {
      description: {
        component:
          "Explains an empty view and offers the next step. Set `headingLevel` to fit the page's outline. The icon is decorative and hidden from screen readers. It is centered and adapts to its container.",
      },
    },
  },
} satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TitleOnly: Story = {
  args: { icon: undefined, description: undefined, action: undefined },
};

export const SeveralActions: Story = {
  args: {
    title: "No results",
    description: "Try a different search, or clear your filters.",
    action: (
      <>
        <Button>Clear filters</Button>
        <Button variant="outline">New invoice</Button>
      </>
    ),
  },
};

export const LevelTwoHeading: Story = {
  args: { headingLevel: 2 },
};

export const LongTextNarrow: Story = {
  render: (args) => (
    <div style={{ width: 240, maxWidth: "100%" }}>
      <EmptyState
        {...args}
        title="Nothing matched your_extremely_long_unbroken_search_term_for_invoices"
        description="We searched every workspace you can see, including archived projects, and found no invoices that match."
      />
    </div>
  ),
};

export const RightToLeft: Story = {
  render: () => (
    <PravaProvider direction="rtl" locale="ar">
      <EmptyState
        icon={icon}
        title="لا توجد فواتير بعد"
        description="تظهر الفواتير هنا بعد أول عملية دفع."
        action={
          <>
            <Button>إضافة طريقة دفع</Button>
            <Button variant="outline">معرفة المزيد</Button>
          </>
        }
      />
    </PravaProvider>
  ),
};

export const Customized: Story = {
  args: {
    className: "custom-empty-state",
    style: { paddingBlock: "1rem", textAlign: "start", alignItems: "start" },
  },
};
