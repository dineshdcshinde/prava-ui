import { createRef } from "react";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { PravaProvider } from "../provider/PravaProvider";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./index";
import type { TableProps } from "./index";

const parts = (
  <>
    <TableHeader>
      <TableRow>
        <TableHead>Client</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell>Northwind</TableCell>
      </TableRow>
    </TableBody>
  </>
);
const table = (props: TableProps, caption?: ReactNode) => (
  <Table {...props}>
    {caption}
    {parts}
  </Table>
);

describe("Table", () => {
  it("keeps native table semantics in every part", () => {
    render(table({}, <TableCaption>Invoices</TableCaption>));
    expect(screen.getByRole("table", { name: "Invoices" }).tagName).toBe(
      "TABLE",
    );
    expect(screen.getAllByRole("rowgroup").map((el) => el.tagName)).toEqual([
      "THEAD",
      "TBODY",
    ]);
    expect(screen.getAllByRole("row").map((el) => el.tagName)).toEqual([
      "TR",
      "TR",
    ]);
    expect(screen.getByRole("columnheader", { name: "Client" }).tagName).toBe(
      "TH",
    );
    expect(screen.getByRole("cell", { name: "Northwind" }).tagName).toBe("TD");
  });

  describe("scroll region name", () => {
    it("comes from the caption and points at its element", () => {
      render(table({}, <TableCaption>Invoices</TableCaption>));
      const region = screen.getByRole("region", { name: "Invoices" });
      expect(region).toHaveAttribute(
        "aria-labelledby",
        screen.getByText("Invoices").id,
      );
      expect(region).not.toHaveAttribute("aria-label");
    });

    it("keeps a caption's own id and finds a caption nested in another component", () => {
      const Wrapped = () => <TableCaption id="mine">Invoices</TableCaption>;
      render(table({}, <Wrapped />));
      expect(screen.getByRole("region")).toHaveAttribute(
        "aria-labelledby",
        "mine",
      );
    });

    it("prefers aria-label over a caption, and names the table too", () => {
      render(
        table(
          { "aria-label": "Recent" },
          <TableCaption>Invoices</TableCaption>,
        ),
      );
      expect(
        screen.getByRole("region", { name: "Recent" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("table", { name: "Recent" })).toBeInTheDocument();
    });

    it("prefers aria-labelledby over aria-label and caption", () => {
      render(
        <>
          <h2 id="heading">Billing</h2>
          {table(
            { "aria-labelledby": "heading", "aria-label": "Recent" },
            <TableCaption>Invoices</TableCaption>,
          )}
        </>,
      );
      expect(
        screen.getByRole("region", { name: "Billing" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("table", { name: "Billing" }),
      ).toBeInTheDocument();
    });

    it("falls back to a localized message and leaves the table unnamed", () => {
      const { rerender } = render(table({}));
      expect(
        screen.getByRole("region", { name: "Scrollable table" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("table")).not.toHaveAttribute("aria-label");

      rerender(
        <PravaProvider messages={{ scrollableTable: "جدول قابل للتمرير" }}>
          {table({})}
        </PravaProvider>,
      );
      expect(
        screen.getByRole("region", { name: "جدول قابل للتمرير" }),
      ).toBeInTheDocument();
    });

    it("follows a caption that appears and disappears", () => {
      const { rerender } = render(
        table({}, <TableCaption>Invoices</TableCaption>),
      );
      rerender(table({}));
      expect(
        screen.getByRole("region", { name: "Scrollable table" }),
      ).not.toHaveAttribute("aria-labelledby");
      rerender(table({}, <TableCaption>Invoices</TableCaption>));
      expect(
        screen.getByRole("region", { name: "Invoices" }),
      ).toBeInTheDocument();
    });

    it("is already named in server-rendered HTML", () => {
      const html = renderToString(
        table({}, <TableCaption>Invoices</TableCaption>),
      );
      expect(html).toContain('role="region"');
      expect(html).toContain('aria-label="Scrollable table"');
    });
  });

  it("puts the region in the tab order, before controls in the cells", async () => {
    render(
      <Table aria-label="Invoices">
        <TableBody>
          <TableRow>
            <TableCell>
              <button>Open</button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    await userEvent.tab();
    expect(screen.getByRole("region")).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "Open" })).toHaveFocus();
  });

  it("defaults to comfortable density without a sticky header", () => {
    render(table({ "aria-label": "Invoices" }));
    const region = screen.getByRole("region");
    expect(region).toHaveAttribute("data-density", "comfortable");
    expect(region).not.toHaveAttribute("data-sticky-header");
  });

  it("exposes density and stickyHeader on the root", () => {
    render(
      table({
        "aria-label": "Invoices",
        density: "compact",
        stickyHeader: true,
      }),
    );
    const region = screen.getByRole("region");
    expect(region).toHaveAttribute("data-density", "compact");
    expect(region).toHaveAttribute("data-sticky-header", "true");
  });

  it("puts className and style on the root, other attributes and the ref on the table", () => {
    const ref = createRef<HTMLTableElement>();
    render(
      <Table
        ref={ref}
        aria-label="Invoices"
        className="mine"
        style={{ maxBlockSize: "10rem" }}
        classNames={{ table: "inner" }}
        data-testid="t"
      >
        {parts}
      </Table>,
    );
    const region = screen.getByRole("region");
    expect(region).toHaveClass("prava-table", "mine");
    expect(region).toHaveStyle({ maxBlockSize: "10rem" });
    expect(ref.current).toBe(screen.getByRole("table"));
    expect(ref.current).toBe(screen.getByTestId("t"));
    expect(ref.current).toHaveClass("prava-table__table", "inner");
  });

  it("forwards refs, classes and attributes on every part", () => {
    const refs = {
      caption: createRef<HTMLTableCaptionElement>(),
      header: createRef<HTMLTableSectionElement>(),
      body: createRef<HTMLTableSectionElement>(),
      row: createRef<HTMLTableRowElement>(),
      head: createRef<HTMLTableCellElement>(),
      cell: createRef<HTMLTableCellElement>(),
    };
    render(
      <Table aria-label="Invoices">
        <TableCaption ref={refs.caption} className="c" title="x">
          Invoices
        </TableCaption>
        <TableHeader ref={refs.header} className="c" title="x">
          <TableRow>
            <TableHead ref={refs.head} className="c" title="x">
              Client
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody ref={refs.body} className="c" title="x">
          <TableRow ref={refs.row} className="c" title="x">
            <TableCell ref={refs.cell} className="c" title="x">
              Northwind
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const slots = {
      caption: ["CAPTION", "prava-table__caption"],
      header: ["THEAD", "prava-table__header"],
      body: ["TBODY", "prava-table__body"],
      row: ["TR", "prava-table__row"],
      head: ["TH", "prava-table__head"],
      cell: ["TD", "prava-table__cell"],
    } as const;
    for (const [part, [tag, slot]] of Object.entries(slots)) {
      const el = refs[part as keyof typeof refs].current!;
      expect(el.tagName).toBe(tag);
      expect(el).toHaveClass(slot, "c");
      expect(el).toHaveAttribute("title", "x");
    }
  });

  it("defaults headers to column scope and accepts row headers and sort state", () => {
    render(
      <Table aria-label="Invoices">
        <TableHeader>
          <TableRow>
            <TableHead aria-sort="ascending">Client</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableHead scope="row">Northwind</TableHead>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const column = screen.getByRole("columnheader", { name: "Client" });
    expect(column).toHaveAttribute("scope", "col");
    expect(column).toHaveAttribute("aria-sort", "ascending");
    expect(
      screen.getByRole("rowheader", { name: "Northwind" }),
    ).toHaveAttribute("scope", "row");
  });

  it("takes its direction from the provider's subtree", () => {
    render(
      <PravaProvider direction="rtl" locale="ar">
        {table({ "aria-label": "الفواتير" })}
      </PravaProvider>,
    );
    expect(screen.getByRole("region").closest("[dir]")).toHaveAttribute(
      "dir",
      "rtl",
    );
  });
});
