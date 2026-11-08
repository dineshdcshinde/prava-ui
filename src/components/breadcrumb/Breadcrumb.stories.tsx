import type { Meta, StoryObj } from "@storybook/react-vite";
import { PravaProvider } from "../provider";
import { Breadcrumb } from "./Breadcrumb";

const items = [
  { label: "Home", href: "#home" },
  { label: "Projects", href: "#projects" },
  { label: "Prava", href: "#prava" },
  { label: "Components", href: "#components" },
  { label: "Settings" },
];

const meta = {
  title: "Navigation/Breadcrumb",
  component: Breadcrumb,
  tags: ["autodocs"],
  args: { items: items.slice(0, 3) },
} satisfies Meta<typeof Breadcrumb>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** The middle items move into a menu; the first item and the current page stay. */
export const Collapsed: Story = { args: { items, maxItems: 3 } };

/** Rows wrap and long labels break instead of overflowing. */
export const LongLabels: Story = {
  args: {
    items: [
      { label: "Home", href: "#home" },
      {
        label: "Quarterly financial planning and forecasting",
        href: "#planning",
      },
      { label: "Averyveryveryveryveryverylongunbrokenprojectname1234567890" },
    ],
  },
};

export const CustomSeparator: Story = {
  args: { items: items.slice(0, 3), separator: "/" },
};

export const WithIcons: Story = {
  args: {
    items: [
      {
        label: "Home",
        href: "#home",
        icon: (
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="M8 2 2 7h2v7h3v-4h2v4h3V7h2z" />
          </svg>
        ),
      },
      { label: "Settings" },
    ],
  },
};

export const RTL: Story = {
  args: {
    maxItems: 3,
    items: [
      { label: "الرئيسية", href: "#home" },
      { label: "المشاريع", href: "#projects" },
      { label: "برافا", href: "#prava" },
      { label: "المكونات", href: "#components" },
      { label: "الإعدادات" },
    ],
  },
  render: (args) => (
    <PravaProvider
      direction="rtl"
      locale="ar"
      messages={{
        breadcrumb: "مسار التنقل",
        showHiddenBreadcrumbs: "إظهار العناصر المخفية",
      }}
    >
      <Breadcrumb {...args} />
    </PravaProvider>
  ),
};

export const Customized: Story = {
  args: {
    items,
    maxItems: 4,
    className: "custom-breadcrumb",
    style: { fontSize: "1rem" },
    classNames: { label: "custom-breadcrumb-label" },
  },
};
