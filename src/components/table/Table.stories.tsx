import type { Meta, StoryObj } from "@storybook/react-vite";
import { PravaProvider } from "../provider/PravaProvider";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./Table";

const invoices = [
  ["INV-1042", "Northwind Traders", "12 Mar 2026", "Paid", "$1,240.00"],
  ["INV-1043", "Contoso Logistics", "14 Mar 2026", "Pending", "$860.50"],
  ["INV-1044", "Fabrikam Studio", "19 Mar 2026", "Overdue", "$3,105.75"],
  ["INV-1045", "Adventure Works", "02 Apr 2026", "Paid", "$412.00"],
];

const rows = (data: string[][]) => (
  <>
    <TableHeader>
      <TableRow>
        <TableHead>Invoice</TableHead>
        <TableHead>Client</TableHead>
        <TableHead>Issued</TableHead>
        <TableHead>Status</TableHead>
        <TableHead style={{ textAlign: "end" }}>Amount</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {data.map(([id, client, issued, status, amount]) => (
        <TableRow key={id}>
          <TableHead scope="row">{id}</TableHead>
          <TableCell>{client}</TableCell>
          <TableCell style={{ whiteSpace: "nowrap" }}>{issued}</TableCell>
          <TableCell>{status}</TableCell>
          <TableCell style={{ textAlign: "end" }}>{amount}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </>
);

const meta = {
  title: "Display/Table",
  component: Table,
  tags: ["autodocs"],
  args: {
    children: (
      <>
        <TableCaption>Invoices issued this quarter</TableCaption>
        {rows(invoices)}
      </>
    ),
  },
} satisfies Meta<typeof Table>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Compact: Story = { args: { density: "compact" } };

/** The region scrolls, so give it a height limit. The header stays pinned. */
export const StickyHeader: Story = {
  args: {
    stickyHeader: true,
    style: { maxBlockSize: "16rem" },
    children: (
      <>
        <TableCaption>All invoices</TableCaption>
        {rows(
          Array.from({ length: 16 }, (_, index) => {
            const [id, ...rest] = invoices[index % invoices.length]!;
            return [`${id}-${index}`, ...rest];
          }),
        )}
      </>
    ),
  },
};

/** Without a visible caption, `aria-label` names both the region and the table. */
export const AriaLabel: Story = {
  args: { "aria-label": "Recent invoices", children: rows(invoices) },
};

export const RTL: Story = {
  render: (args) => (
    <PravaProvider direction="rtl" locale="ar">
      <Table {...args}>
        <TableCaption>فواتير هذا الربع</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>الفاتورة</TableHead>
            <TableHead>العميل</TableHead>
            <TableHead>تاريخ الإصدار</TableHead>
            <TableHead>الحالة</TableHead>
            <TableHead style={{ textAlign: "end" }}>المبلغ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[
            [
              "١٠٤٢",
              "شركة النور للتجارة",
              "١٢ مارس ٢٠٢٦",
              "مدفوعة",
              "١٬٢٤٠٫٠٠",
            ],
            ["١٠٤٣", "مؤسسة الأفق", "١٤ مارس ٢٠٢٦", "قيد الانتظار", "٨٦٠٫٥٠"],
            ["١٠٤٤", "استوديو الواحة", "١٩ مارس ٢٠٢٦", "متأخرة", "٣٬١٠٥٫٧٥"],
          ].map(([id, client, issued, status, amount]) => (
            <TableRow key={id}>
              <TableHead scope="row">{id}</TableHead>
              <TableCell style={{ whiteSpace: "nowrap" }}>{client}</TableCell>
              <TableCell style={{ whiteSpace: "nowrap" }}>{issued}</TableCell>
              <TableCell style={{ whiteSpace: "nowrap" }}>{status}</TableCell>
              <TableCell style={{ textAlign: "end" }}>{amount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </PravaProvider>
  ),
};

export const Customized: Story = {
  args: {
    className: "custom-table",
    classNames: { table: "custom-table__table" },
    style: { borderRadius: 0, maxInlineSize: "32rem" },
  },
};
