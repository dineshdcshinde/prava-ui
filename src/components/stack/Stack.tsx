import { forwardRef } from "react";
import type { ElementType, HTMLAttributes } from "react";

export type StackProps = HTMLAttributes<HTMLElement> & {
  /** Flow direction; `horizontal` follows the text direction. */
  orientation?: "vertical" | "horizontal";
  /** Space between children, in steps of 4px. */
  gap?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12;
  /** Cross-axis alignment. Defaults to `stretch` when vertical and `center` when horizontal. */
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  /** Main-axis distribution. */
  justify?: "start" | "center" | "end" | "between";
  /** Lets children wrap onto new lines when they run out of room. */
  wrap?: boolean;
  /** Element to render, such as `ul` or `nav`. */
  as?: ElementType;
};

/**
 * Arranges children in a row or column with a consistent gap, without wrapping each child.
 * @example
 * ```tsx
 * import { Stack } from '@prava-ui/react/stack';
 *
 * <Stack orientation="horizontal" gap={2} wrap><Button>Save</Button><Button>Cancel</Button></Stack>
 * ```
 */
export const Stack = forwardRef<HTMLElement, StackProps>(function Stack(
  {
    orientation = "vertical",
    gap = 4,
    align,
    justify,
    wrap,
    as: Tag = "div",
    className,
    ...props
  },
  ref,
) {
  return (
    <Tag
      {...props}
      ref={ref}
      className={["prava-stack", className].filter(Boolean).join(" ")}
      data-orientation={orientation}
      data-gap={gap}
      data-align={align}
      data-justify={justify}
      data-wrap={wrap || undefined}
    />
  );
});
