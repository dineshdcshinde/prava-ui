import { forwardRef } from "react";
import type { ElementType, HTMLAttributes } from "react";

export type ContainerProps = HTMLAttributes<HTMLElement> & {
  /** Maximum content width. `fluid` removes the limit but keeps the responsive padding. */
  size?: "sm" | "md" | "lg" | "xl" | "fluid";
  /** Element to render, such as `main` or `section`. */
  as?: ElementType;
};

/**
 * Centers content and keeps a responsive inline gutter. Set `--prava-container-max` for a custom width.
 * @example
 * ```tsx
 * import { Container } from 'prava-ui/container';
 *
 * <Container as="main" size="md">Page content</Container>
 * ```
 */
export const Container = forwardRef<HTMLElement, ContainerProps>(
  function Container(
    { size = "lg", as: Tag = "div", className, ...props },
    ref,
  ) {
    return (
      <Tag
        {...props}
        ref={ref}
        className={["prava-container", className].filter(Boolean).join(" ")}
        data-size={size}
      />
    );
  },
);
