import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PravaProvider } from "../provider";
import { Pagination } from "./Pagination";

const meta = {
  title: "Navigation/Pagination",
  component: Pagination,
  tags: ["autodocs"],
  args: { pageCount: 20, defaultPage: 5 },
} satisfies Meta<typeof Pagination>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Controlled: Story = {
  render: function Render(args) {
    const [page, setPage] = useState(3);
    return (
      <>
        <Pagination
          {...args}
          defaultPage={undefined}
          page={page}
          onPageChange={setPage}
        />
        <p>Showing page {page}</p>
      </>
    );
  },
};

/** With `getHref`, every page is a real link, so opening one in a new tab works. */
export const Links: Story = {
  args: { getHref: (page) => `#page-${page}` },
};

export const MoreSiblings: Story = {
  args: { siblingCount: 2, defaultPage: 10 },
};

/** One page keeps the control in place with both arrows disabled. Zero pages render nothing. */
export const SinglePage: Story = { args: { pageCount: 1, defaultPage: 1 } };

/** Numbers drop as the container narrows, whatever the viewport. Previous and next always stay. */
export const NarrowContainers: Story = {
  render: (args) => (
    <div style={{ display: "grid", gap: "1rem" }}>
      {[560, 400, 288, 240].map((width) => (
        <div
          key={width}
          data-testid={`width-${width}`}
          style={{ inlineSize: width, maxInlineSize: "100%" }}
        >
          <Pagination {...args} />
        </div>
      ))}
    </div>
  ),
};

/** Numbers and labels follow the provider's locale and messages, and the arrows mirror. */
export const RTL: Story = {
  render: (args) => (
    <PravaProvider
      direction="rtl"
      locale="ar-EG"
      messages={{
        pagination: "ترقيم الصفحات",
        previousPage: "الصفحة السابقة",
        nextPage: "الصفحة التالية",
        goToPage: "انتقل إلى الصفحة {page}",
      }}
    >
      <Pagination {...args} />
    </PravaProvider>
  ),
};

export const Customized: Story = {
  args: {
    className: "custom-pagination",
    style: { maxInlineSize: "32rem", marginInline: "auto" },
    classNames: { link: "custom-pagination-link" },
    "aria-label": "Search results pages",
  },
};
