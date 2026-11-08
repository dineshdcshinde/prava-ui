import { forwardRef } from "react";
import type { HTMLAttributes, MouseEvent, ReactNode } from "react";
import { fillMessage } from "../field/field";
import { usePravaConfig } from "../provider/PravaProvider";
import { useControllable } from "../../internal/useControllable";

export type PaginationProps = Omit<
  HTMLAttributes<HTMLElement>,
  "children" | "onChange"
> & {
  /** Current 1-based page when controlled. Shown clamped to `1…pageCount`. */
  page?: number;
  /** Initial 1-based page when uncontrolled. */
  defaultPage?: number;
  /** Called with the 1-based page the user chose. */
  onPageChange?: (page: number) => void;
  /** Total number of pages. Below one, nothing renders. */
  pageCount: number;
  /** Page numbers shown on each side of the current page when there is room. */
  siblingCount?: number;
  /** Renders links instead of buttons, using this URL for each page. */
  getHref?: (page: number) => string;
  /** Extra classes for the inner slots. */
  classNames?: {
    list?: string;
    item?: string;
    link?: string;
    ellipsis?: string;
  };
};

const cx = (...classes: (string | undefined)[]) =>
  classes.filter(Boolean).join(" ");

const whole = (value: number, fallback: number) =>
  Number.isFinite(value) ? Math.trunc(value) : fallback;

/** Page numbers for wide layouts. A gap always hides at least two pages, so the slot count stays fixed. */
const visiblePages = (page: number, count: number, siblings: number) => {
  if (count === 1) return [1];
  const slots = 2 * siblings + 5;
  const lo =
    count <= slots || page - siblings <= 3
      ? 2
      : Math.min(page - siblings, count - slots + 3);
  const hi =
    count <= slots || page + siblings >= count - 2
      ? count - 1
      : Math.max(page + siblings, slots - 2);
  const middle = Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  return [1, ...middle, count];
};

/**
 * Moves through paged content, showing fewer numbers as its container narrows.
 * @example
 * ```tsx
 * import { Pagination } from 'prava-ui/pagination';
 *
 * <Pagination pageCount={20} defaultPage={5} onPageChange={loadPage} />
 * <Pagination pageCount={20} page={page} getHref={(p) => `/posts?page=${p}`} />
 * ```
 */
export const Pagination = forwardRef<HTMLElement, PaginationProps>(
  function Pagination(
    {
      page,
      defaultPage = 1,
      onPageChange,
      pageCount,
      siblingCount = 1,
      getHref,
      classNames,
      className,
      ...props
    },
    ref,
  ) {
    const { messages, locale } = usePravaConfig();
    const [rawPage, setPage] = useControllable(page, defaultPage, onPageChange);
    const count = Math.max(0, whole(pageCount, 0));
    if (count === 0) return null;

    const current = Math.min(Math.max(1, whole(rawPage, 1)), count);
    const pages = visiblePages(
      current,
      count,
      Math.max(0, whole(siblingCount, 1)),
    );
    const number = new Intl.NumberFormat(locale);

    const control = (
      target: number,
      label: string,
      content: ReactNode,
      disabled = false,
    ) => {
      const shared = {
        className: cx("prava-pagination__link", classNames?.link),
        "aria-label": label,
        "aria-current": target === current ? ("page" as const) : undefined,
        // Not native disabled: that would drop keyboard focus on reaching either end.
        "aria-disabled": disabled || undefined,
      };
      const choose = () => {
        if (!disabled && target !== current) setPage(target);
      };
      if (!getHref) {
        return (
          <button type="button" {...shared} onClick={choose}>
            {content}
          </button>
        );
      }
      return (
        <a
          {...shared}
          href={disabled ? undefined : getHref(target)}
          role={disabled ? "link" : undefined}
          tabIndex={disabled ? 0 : undefined}
          onClick={(event: MouseEvent<HTMLAnchorElement>) => {
            // A modified click opens elsewhere, so this page stays put.
            if (
              !event.metaKey &&
              !event.ctrlKey &&
              !event.shiftKey &&
              !event.altKey
            ) {
              choose();
            }
          }}
        >
          {content}
        </a>
      );
    };

    const gap = (key: string, compactOnly: boolean) => (
      <li
        key={key}
        aria-hidden="true"
        className={cx(
          "prava-pagination__item prava-pagination__ellipsis",
          classNames?.item,
          classNames?.ellipsis,
        )}
        data-edge=""
        data-compact-only={compactOnly ? "" : undefined}
      >
        …
      </li>
    );

    const itemClass = cx("prava-pagination__item", classNames?.item);

    return (
      <nav
        aria-label={messages.pagination}
        {...props}
        ref={ref}
        className={cx("prava-pagination", className)}
      >
        <ul className={cx("prava-pagination__list", classNames?.list)}>
          <li className={itemClass}>
            {control(
              current - 1,
              messages.previousPage,
              <svg
                className="prava-pagination__icon"
                viewBox="0 0 16 16"
                aria-hidden="true"
              >
                <path d="M10 3.5 5.5 8l4.5 4.5" />
              </svg>,
              current === 1,
            )}
          </li>
          {pages.flatMap((value, index) => {
            const edge = value === 1 || value === count;
            const item = (
              <li
                key={value}
                className={itemClass}
                data-edge={edge && value !== current ? "" : undefined}
                data-sibling={!edge && value !== current ? "" : undefined}
              >
                {control(
                  value,
                  fillMessage(messages.goToPage, { page: value }, locale),
                  number.format(value),
                )}
              </li>
            );
            // Compact layouts hide siblings, which can open a gap the wide layout does not have.
            if (index === 0 && current > 2) {
              return [item, gap("gap-start", pages[1] === 2)];
            }
            if (
              index === pages.length - 1 &&
              index > 0 &&
              current < count - 1
            ) {
              return [gap("gap-end", pages[index - 1] === count - 1), item];
            }
            return [item];
          })}
          <li className={itemClass}>
            {control(
              current + 1,
              messages.nextPage,
              <svg
                className="prava-pagination__icon"
                viewBox="0 0 16 16"
                aria-hidden="true"
              >
                <path d="M6 3.5 10.5 8 6 12.5" />
              </svg>,
              current === count,
            )}
          </li>
        </ul>
      </nav>
    );
  },
);
