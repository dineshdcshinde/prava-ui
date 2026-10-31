import type { HTMLAttributes } from "react";

export type SeparatorProps = HTMLAttributes<HTMLDivElement> & {
  /** The direction the separator follows in its layout. */
  orientation?: "horizontal" | "vertical";
  /** Expose a semantic separator to assistive technology when it marks a meaningful boundary. */
  decorative?: boolean;
};

/** Separates adjacent content with a quiet, theme-aware rule. */
export function Separator({
  orientation = "horizontal",
  decorative = true,
  className,
  ...props
}: SeparatorProps) {
  return (
    <div
      {...props}
      className={["prava-separator", className].filter(Boolean).join(" ")}
      data-orientation={orientation}
      role={decorative ? undefined : "separator"}
      aria-hidden={decorative ? true : undefined}
      aria-orientation={decorative ? undefined : orientation}
    />
  );
}
