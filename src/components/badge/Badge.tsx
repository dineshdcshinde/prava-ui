import type { HTMLAttributes, ReactNode } from 'react';

/** Props for a compact indicator anchored to a child element. */
export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  /** Visible count or status text; meaning must not rely on color alone. */
  content: ReactNode;
  /** The element the indicator is anchored to. */
  children: ReactNode;
  /** Semantic color treatment. */
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  /** Selects the indicator's compact or standard dimensions. */
  size?: 'sm' | 'md';
  /** Positions the indicator on a physical child corner; defaults to top-right. */
  placement?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
};

/**
 * Anchors a non-interactive count or status indicator to a child element.
 * @example
 * ```tsx
 * import { Badge } from 'prava-ui/badge';
 * import { Button } from 'prava-ui/button';
 *
 * <Badge content="3" placement="top-right"><Button>Inbox</Button></Badge>
 * ```
 */
export function Badge({ tone = 'danger', size = 'sm', placement = 'top-right', content, className, children, ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={['prava-badge', className].filter(Boolean).join(' ')}
    >
      <span className="prava-badge__target">{children}</span>
      <span className="prava-badge__indicator" data-tone={tone} data-size={size} data-placement={placement}>{content}</span>
    </span>
  );
}
