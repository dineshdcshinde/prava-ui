import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";

export type EmptyStateProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "title" | "children"
> & {
  /** Decorative graphic above the title. Hidden from screen readers. */
  icon?: ReactNode;
  /** Says what is empty. Rendered as a heading. */
  title: ReactNode;
  /** Explains why the view is empty or what to do next. */
  description?: ReactNode;
  /** The next step, such as a Button. Several controls wrap and stay centered. */
  action?: ReactNode;
  /** Heading level of the title, to fit the page's outline. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
};

/**
 * Explains an empty view and offers the next step. Centered, and as wide as its container allows.
 * @example
 * ```tsx
 * import { EmptyState } from 'prava-ui/empty-state';
 *
 * <EmptyState
 *   title="No invoices yet"
 *   description="Invoices appear here after your first payment."
 *   action={<Button>Add a payment method</Button>}
 * />
 * ```
 */
export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  function EmptyState(
    { icon, title, description, action, headingLevel = 3, className, ...props },
    ref,
  ) {
    const Heading = `h${headingLevel}` as "h3";
    return (
      <div
        {...props}
        ref={ref}
        className={["prava-empty-state", className].filter(Boolean).join(" ")}
      >
        {/* Truthy checks keep `action={canAdd && <Button />}` from leaving an empty slot. */}
        {icon ? (
          <span className="prava-empty-state__icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <Heading className="prava-empty-state__title">{title}</Heading>
        {description ? (
          <div className="prava-empty-state__description">{description}</div>
        ) : null}
        {action ? (
          <div className="prava-empty-state__action">{action}</div>
        ) : null}
      </div>
    );
  },
);
