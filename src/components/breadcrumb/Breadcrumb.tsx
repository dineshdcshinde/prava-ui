import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { DropdownMenu } from "../dropdown-menu";
import { usePravaConfig } from "../provider/PravaProvider";

export type BreadcrumbItem = {
  /** What people see; pass translated text or a node. */
  label: ReactNode;
  /** Renders the item as a link. Without it, the item is plain text. */
  href?: string;
  /** Decorative icon before the label. */
  icon?: ReactNode;
};

export type BreadcrumbProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  /** Path from the root to the current page; the last item is the current page. */
  items: readonly BreadcrumbItem[];
  /** Decorative node between items, replacing the chevron. Hidden from assistive technology; mirrors in RTL. */
  separator?: ReactNode;
  /** Most items to show; the middle ones move into a menu. The current page always stays visible. */
  maxItems?: number;
  /** Extra classes for inner slots. */
  classNames?: {
    list?: string;
    item?: string;
    label?: string;
    separator?: string;
    trigger?: string;
  };
};

const cx = (...names: (string | undefined)[]) =>
  names.filter(Boolean).join(" ");

/**
 * Shows where the current page sits in a hierarchy.
 * @example
 * ```tsx
 * import { Breadcrumb } from 'prava-ui/breadcrumb';
 *
 * <Breadcrumb
 *   maxItems={3}
 *   items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Projects', href: '/projects' },
 *     { label: 'Prava', href: '/projects/prava' },
 *     { label: 'Settings' },
 *   ]}
 * />
 * ```
 */
export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  function Breadcrumb(
    { items, separator, maxItems, classNames, className, ...props },
    ref,
  ) {
    const { messages } = usePravaConfig();
    const limit = Math.max(1, maxItems ?? items.length);
    const collapsed = items.length > limit;
    // With a single slot, the current page takes it and no leading item shows.
    const head = collapsed && limit > 1 ? 1 : 0;
    const tail = collapsed ? items.length - (limit - head) : 0;

    const divider = (
      <span
        className={cx("prava-breadcrumb__separator", classNames?.separator)}
        aria-hidden="true"
      >
        {separator ?? (
          <svg className="prava-breadcrumb__chevron" viewBox="0 0 16 16">
            <path d="M6 4l4 4-4 4" />
          </svg>
        )}
      </span>
    );

    const renderItem = (item: BreadcrumbItem, index: number) => {
      const last = index === items.length - 1;
      const label = {
        className: cx("prava-breadcrumb__label", classNames?.label),
        "aria-current": last ? ("page" as const) : undefined,
        children: (
          <>
            {item.icon != null && (
              <span className="prava-breadcrumb__icon" aria-hidden="true">
                {item.icon}
              </span>
            )}
            <span>{item.label}</span>
          </>
        ),
      };
      return (
        <li
          key={index}
          className={cx("prava-breadcrumb__item", classNames?.item)}
        >
          {item.href ? <a {...label} href={item.href} /> : <span {...label} />}
          {!last && divider}
        </li>
      );
    };

    return (
      <nav
        aria-label={messages.breadcrumb}
        {...props}
        ref={ref}
        className={cx("prava-breadcrumb", className)}
      >
        <ol className={cx("prava-breadcrumb__list", classNames?.list)}>
          {items.slice(0, head).map(renderItem)}
          {collapsed && (
            <li className={cx("prava-breadcrumb__item", classNames?.item)}>
              <DropdownMenu
                trigger={
                  <button
                    type="button"
                    className={cx(
                      "prava-breadcrumb__trigger",
                      classNames?.trigger,
                    )}
                    aria-label={messages.showHiddenBreadcrumbs}
                  >
                    <svg viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M3.5 8h.01M8 8h.01M12.5 8h.01" />
                    </svg>
                  </button>
                }
                items={items.slice(head, tail).map((item) => ({
                  ...item,
                  // A crumb without a link has nothing to do when chosen.
                  disabled: !item.href,
                }))}
              />
              {divider}
            </li>
          )}
          {items
            .slice(tail)
            .map((item, index) => renderItem(item, tail + index))}
        </ol>
      </nav>
    );
  },
);
