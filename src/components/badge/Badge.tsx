import type { HTMLAttributes, ReactNode } from "react";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  /** Visible badge text or count. Status meaning must be in this text, not only the tone. */
  content: ReactNode;
  /** Element the badge is anchored to. Omit to render a standalone status label. */
  children?: ReactNode;
  /** Semantic color. Defaults to `danger` when anchored (counts) and `neutral` when standalone. */
  tone?: "neutral" | "primary" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md";
  /** Corner of the anchored element, in logical directions so it mirrors in RTL. */
  placement?: "top-start" | "top-end" | "bottom-start" | "bottom-end";
};

/**
 * A compact, non-interactive status or count, either anchored to an element or standalone.
 * @example
 * ```tsx
 * import { Badge } from '@prava-ui/react/badge';
 * <Badge content="3"><Button>Inbox</Button></Badge>
 * <Badge tone="success" content="Active" />
 * ```
 */
export function Badge({
  tone,
  size = "sm",
  placement = "top-end",
  content,
  className,
  children,
  ...props
}: BadgeProps) {
  const standalone = children == null;
  return (
    <span
      {...props}
      className={["prava-badge", className].filter(Boolean).join(" ")}
      data-standalone={standalone || undefined}
    >
      {!standalone && <span className="prava-badge__target">{children}</span>}
      <span
        className="prava-badge__indicator"
        data-tone={tone ?? (standalone ? "neutral" : "danger")}
        data-size={size}
        data-placement={standalone ? undefined : placement}
      >
        {content}
      </span>
    </span>
  );
}
