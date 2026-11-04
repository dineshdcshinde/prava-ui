import { forwardRef } from "react";
import type { CSSProperties, ElementType, HTMLAttributes } from "react";

export type GridProps = HTMLAttributes<HTMLElement> & {
  /**
   * Most columns to show. Columns still drop when each would be narrower than `minColumnWidth`,
   * down to one. Omit to fit as many `minColumnWidth` columns as the space allows.
   */
  columns?: number;
  /** Narrowest a column may get, as a CSS length. Defaults to 16rem, or 10rem with `columns`. */
  minColumnWidth?: string;
  /** Space between cells, in steps of 4px. */
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
  /** Element to render, such as `ul` or `section`. */
  as?: ElementType;
};

/**
 * Responsive CSS grid: fills the width, and collapses to one column on its own when space is narrow.
 * @example
 * ```tsx
 * import { Grid } from 'prava-ui/grid';
 *
 * <Grid columns={3} gap={4}><Card /><Card /><Card /></Grid>
 * ```
 */
export const Grid = forwardRef<HTMLElement, GridProps>(function Grid(
  {
    columns,
    minColumnWidth,
    gap = 4,
    as: Tag = "div",
    className,
    style,
    ...props
  },
  ref,
) {
  return (
    <Tag
      {...props}
      ref={ref}
      className={["prava-grid", className].filter(Boolean).join(" ")}
      data-gap={gap}
      data-columns={columns}
      style={
        {
          "--prava-grid-columns": columns,
          "--prava-grid-min": minColumnWidth,
          ...style,
        } as CSSProperties
      }
    />
  );
});
