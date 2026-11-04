import { createContext, useContext, useId } from "react";
import type { HTMLAttributes, KeyboardEvent, ReactNode } from "react";
import { useControllable } from "../../internal/useControllable";

type AccordionContextValue = {
  open: readonly string[];
  toggle: (value: string) => void;
  headingLevel: 2 | 3 | 4 | 5 | 6;
};
const AccordionContext = createContext<AccordionContextValue | null>(null);

export type AccordionProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "defaultValue"
> & {
  /** Lets several items stay open. By default, opening one closes the others. */
  multiple?: boolean;
  /** Open item values when controlled. */
  value?: readonly string[];
  /** Initially open item values when uncontrolled. */
  defaultValue?: readonly string[];
  /** Called with every open value after a change. */
  onValueChange?: (value: string[]) => void;
  /** Heading level of each item, to fit the page's outline. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
};

/**
 * Discloses related content. Up and Down, Home and End move between headers.
 * @example
 * ```tsx
 * import { Accordion, AccordionItem } from 'prava-ui/accordion';
 *
 * <Accordion defaultValue={['billing']}>
 *   <AccordionItem value="billing" title="Billing">Invoices are sent monthly.</AccordionItem>
 *   <AccordionItem value="security" title="Security">Data is encrypted at rest.</AccordionItem>
 * </Accordion>
 * ```
 */
export function Accordion({
  multiple,
  value,
  defaultValue = [],
  onValueChange,
  headingLevel = 3,
  className,
  onKeyDown,
  ...props
}: AccordionProps) {
  const [open, setOpen] = useControllable<readonly string[]>(
    value,
    defaultValue,
    onValueChange as ((next: readonly string[]) => void) | undefined,
  );
  const toggle = (item: string) => {
    const others = open.filter((v) => v !== item);
    if (open.includes(item)) setOpen(others);
    else setOpen(multiple ? [...open, item] : [item]);
  };

  return (
    <AccordionContext.Provider value={{ open, toggle, headingLevel }}>
      <div
        {...props}
        className={["prava-accordion", className].filter(Boolean).join(" ")}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          onKeyDown?.(event);
          if (event.defaultPrevented) return;
          const root = event.currentTarget;
          // Headers of an Accordion nested in a panel belong to that Accordion.
          const triggers = Array.from(
            root.querySelectorAll<HTMLButtonElement>(
              ".prava-accordion__trigger:not(:disabled)",
            ),
          ).filter((el) => el.closest(".prava-accordion") === root);
          const index = triggers.indexOf(event.target as HTMLButtonElement);
          if (index < 0) return;
          const next: Record<string, number> = {
            ArrowDown: index + 1,
            ArrowUp: index - 1,
            Home: 0,
            End: triggers.length - 1,
          };
          const target = next[event.key];
          if (target === undefined) return;
          event.preventDefault();
          triggers[(target + triggers.length) % triggers.length]?.focus();
        }}
      />
    </AccordionContext.Provider>
  );
}

export type AccordionItemProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> & {
  /** Identifies the item in `value`. Keep it stable across languages. */
  value: string;
  /** Text of the header button. */
  title: ReactNode;
  /** Stops the header from toggling; the panel keeps its current state. */
  disabled?: boolean;
};

/**
 * One header and its panel. A closed panel is hidden from keyboard and screen readers.
 * @example
 * ```tsx
 * <AccordionItem value="billing" title="Billing">Invoices are sent monthly.</AccordionItem>
 * ```
 */
export function AccordionItem({
  value,
  title,
  disabled,
  className,
  children,
  ...props
}: AccordionItemProps) {
  const context = useContext(AccordionContext);
  if (!context) throw new Error("AccordionItem must be inside <Accordion>.");
  const id = useId();
  const isOpen = context.open.includes(value);
  const Heading = `h${context.headingLevel}` as "h3";
  return (
    <div
      {...props}
      className={["prava-accordion__item", className].filter(Boolean).join(" ")}
      data-open={isOpen ? "" : undefined}
    >
      <Heading className="prava-accordion__heading">
        <button
          type="button"
          id={`${id}-trigger`}
          className="prava-accordion__trigger"
          aria-expanded={isOpen}
          aria-controls={`${id}-panel`}
          disabled={disabled}
          onClick={() => context.toggle(value)}
        >
          <span className="prava-accordion__title">{title}</span>
          <svg
            className="prava-accordion__chevron"
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <path d="M4 6l4 4 4-4" />
          </svg>
        </button>
      </Heading>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-trigger`}
        className="prava-accordion__panel"
      >
        <div className="prava-accordion__clip">
          <div className="prava-accordion__content">{children}</div>
        </div>
      </div>
    </div>
  );
}
