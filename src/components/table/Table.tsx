import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useState,
} from "react";
import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import { usePravaConfig } from "../provider/PravaProvider";

const cx = (...classes: (string | undefined)[]) =>
  classes.filter(Boolean).join(" ");

/** Lets TableCaption, wherever it's nested, name the scroll region. */
const RegisterCaption = createContext<
  ((id: string | undefined) => void) | null
>(null);

export type TableProps = TableHTMLAttributes<HTMLTableElement> & {
  /** Row spacing and text size. */
  density?: "compact" | "comfortable";
  /** Pins the header row while rows scroll. Limit the height with `style` or `className` on the root, such as `maxBlockSize`. */
  stickyHeader?: boolean;
  /** Extra classes for inner slots. `className` and `style` go on the scroll region, the root. */
  classNames?: { table?: string };
};

/**
 * A native data table inside its own named, keyboard-scrollable region, so wide data never widens the page.
 * The region's name comes from `aria-labelledby`, `aria-label` or TableCaption, in that order; give it one of them.
 * @example
 * ```tsx
 * import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from 'prava-ui/table';
 *
 * <Table>
 *   <TableCaption>Invoices</TableCaption>
 *   <TableHeader>
 *     <TableRow><TableHead>Client</TableHead><TableHead>Status</TableHead></TableRow>
 *   </TableHeader>
 *   <TableBody>
 *     <TableRow><TableCell>Northwind</TableCell><TableCell>Paid</TableCell></TableRow>
 *   </TableBody>
 * </Table>
 * ```
 */
export const Table = forwardRef<HTMLTableElement, TableProps>(function Table(
  {
    density = "comfortable",
    stickyHeader,
    className,
    style,
    classNames,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    ...props
  },
  ref,
) {
  const { messages } = usePravaConfig();
  const [captionId, setCaptionId] = useState<string>();
  const regionLabelledBy =
    ariaLabelledBy ?? (ariaLabel ? undefined : captionId);

  return (
    <div
      role="region"
      // A scrolling region must be reachable by keyboard.
      tabIndex={0}
      aria-labelledby={regionLabelledBy}
      // The fallback also keeps server-rendered HTML named until TableCaption registers.
      aria-label={
        regionLabelledBy ? undefined : ariaLabel || messages.scrollableTable
      }
      className={cx("prava-table", className)}
      style={style}
      data-density={density}
      data-sticky-header={stickyHeader || undefined}
    >
      <RegisterCaption.Provider value={setCaptionId}>
        <table
          {...props}
          ref={ref}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          className={cx("prava-table__table", classNames?.table)}
        />
      </RegisterCaption.Provider>
    </div>
  );
});

export type TableCaptionProps = HTMLAttributes<HTMLTableCaptionElement>;

/**
 * Names the table and its scroll region. Render it first inside Table.
 * @example
 * ```tsx
 * <TableCaption>Invoices</TableCaption>
 * ```
 */
export const TableCaption = forwardRef<
  HTMLTableCaptionElement,
  TableCaptionProps
>(function TableCaption({ id, className, ...props }, ref) {
  const generatedId = useId();
  const captionId = id ?? generatedId;
  const register = useContext(RegisterCaption);
  useEffect(() => {
    register?.(captionId);
    return () => register?.(undefined);
  }, [register, captionId]);
  return (
    <caption
      {...props}
      ref={ref}
      id={captionId}
      className={cx("prava-table__caption", className)}
    />
  );
});

export type TableHeaderProps = HTMLAttributes<HTMLTableSectionElement>;

/**
 * The table's header rows, a native `<thead>`.
 * @example
 * ```tsx
 * <TableHeader><TableRow><TableHead>Client</TableHead></TableRow></TableHeader>
 * ```
 */
export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  TableHeaderProps
>(function TableHeader({ className, ...props }, ref) {
  return (
    <thead
      {...props}
      ref={ref}
      className={cx("prava-table__header", className)}
    />
  );
});

export type TableBodyProps = HTMLAttributes<HTMLTableSectionElement>;

/**
 * The table's data rows, a native `<tbody>`.
 * @example
 * ```tsx
 * <TableBody><TableRow><TableCell>Northwind</TableCell></TableRow></TableBody>
 * ```
 */
export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  function TableBody({ className, ...props }, ref) {
    return (
      <tbody
        {...props}
        ref={ref}
        className={cx("prava-table__body", className)}
      />
    );
  },
);

export type TableRowProps = HTMLAttributes<HTMLTableRowElement>;

/**
 * A native `<tr>`.
 * @example
 * ```tsx
 * <TableRow><TableCell>Northwind</TableCell></TableRow>
 * ```
 */
export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  function TableRow({ className, ...props }, ref) {
    return (
      <tr {...props} ref={ref} className={cx("prava-table__row", className)} />
    );
  },
);

export type TableHeadProps = ThHTMLAttributes<HTMLTableCellElement>;

/**
 * A header cell, a native `<th>` that defaults to `scope="col"`. Pass `scope="row"` for a row header.
 * @example
 * ```tsx
 * <TableHead aria-sort="ascending">Client</TableHead>
 * ```
 */
export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  function TableHead({ scope = "col", className, ...props }, ref) {
    return (
      <th
        {...props}
        ref={ref}
        scope={scope}
        className={cx("prava-table__head", className)}
      />
    );
  },
);

export type TableCellProps = TdHTMLAttributes<HTMLTableCellElement>;

/**
 * A data cell, a native `<td>`. Align numbers with `style={{ textAlign: 'end' }}`.
 * @example
 * ```tsx
 * <TableCell>Northwind</TableCell>
 * ```
 */
export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  function TableCell({ className, ...props }, ref) {
    return (
      <td {...props} ref={ref} className={cx("prava-table__cell", className)} />
    );
  },
);
