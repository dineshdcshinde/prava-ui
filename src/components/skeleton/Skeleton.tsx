import type { HTMLAttributes } from "react";

export type SkeletonProps = HTMLAttributes<HTMLSpanElement> & {
  /** Shape of the reserved content space. Set dimensions with `style` when the content size is known. */
  shape?: "text" | "rect" | "circle";
};

/** Reserves layout space while content is loading; decorative motion stops for reduced-motion users. */
export function Skeleton({
  shape = "rect",
  className,
  style,
  ...props
}: SkeletonProps) {
  return (
    <span
      {...props}
      className={["prava-skeleton", className].filter(Boolean).join(" ")}
      data-shape={shape}
      aria-hidden="true"
      style={{
        ...style,
        ...(shape === "circle" ? { aspectRatio: "1 / 1" } : {}),
      }}
    />
  );
}
