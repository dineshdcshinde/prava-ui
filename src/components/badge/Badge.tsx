import type { HTMLAttributes, ReactNode } from 'react';

const toneClasses = {
  neutral: 'border-[var(--prava-color-border)] bg-[var(--prava-color-surface)] text-[var(--prava-color-text)]',
  primary: 'border-transparent bg-[var(--prava-color-primary)] text-[var(--prava-color-on-primary)]',
  success: 'border-transparent bg-[var(--prava-color-success)] text-[var(--prava-color-on-primary)]',
  warning: 'border-transparent bg-[var(--prava-color-warning)] text-[var(--prava-color-on-primary)]',
  danger: 'border-transparent bg-[var(--prava-color-danger)] text-[var(--prava-color-on-primary)]',
  info: 'border-transparent bg-[var(--prava-color-info)] text-[var(--prava-color-on-primary)]',
} as const;

const sizeClasses = {
  sm: 'min-h-[1.125rem] min-w-[1.125rem] px-1 py-px text-[.6875rem]',
  md: 'min-h-[1.5rem] min-w-[1.5rem] px-[.375rem] py-[.125rem] text-[.75rem]',
} as const;

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
};

/**
 * Anchors a non-interactive count or status indicator to a child element.
 * @example
 * ```tsx
 * import { Badge } from 'prava-ui/badge';
 * import { Button } from 'prava-ui/button';
 *
 * <Badge content="3"><Button>Inbox</Button></Badge>
 * ```
 */
export function Badge({ tone = 'danger', size = 'sm', content, className, children, ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={['prava-badge relative inline-flex overflow-visible align-middle', className].filter(Boolean).join(' ')}
    >
      <span className="prava-badge__target inline-flex max-w-full">{children}</span>
      <span className={['prava-badge__indicator pointer-events-none absolute end-0 top-0 z-10 inline-flex max-w-full -translate-y-[35%] translate-x-1/2 items-center justify-center break-words rounded-[9999px] border border-[var(--prava-color-canvas)] font-[inherit] font-[600] leading-[1.25] shadow-[var(--prava-shadow-control)] rtl:-translate-x-1/2', toneClasses[tone], sizeClasses[size]].join(' ')} data-tone={tone} data-size={size}>{content}</span>
    </span>
  );
}
