import { createContext, useContext, useEffect, useId, useRef } from "react";
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  KeyboardEvent,
  ReactNode,
} from "react";
import { useControllable } from "../../internal/useControllable";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
  activation: "automatic" | "manual";
  orientation: "horizontal" | "vertical";
  id: string;
};
const TabsContext = createContext<TabsContextValue | null>(null);

const useTabs = () => {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tab parts must be inside <Tabs>.");
  return context;
};
const tabId = (id: string, value: string) =>
  `${id}-tab-${encodeURIComponent(value)}`;
const panelId = (id: string, value: string) =>
  `${id}-panel-${encodeURIComponent(value)}`;

export type TabsProps = Omit<HTMLAttributes<HTMLDivElement>, "defaultValue"> & {
  /** Called with the tab's `value` when it's chosen. */
  onValueChange?: (value: string) => void;
  /** `automatic` selects as focus moves. Use `manual` (Enter or Space) when panels are slow to show. */
  activation?: "automatic" | "manual";
  /** Layout of the tab list, which also picks the arrow keys: left/right or up/down. */
  orientation?: "horizontal" | "vertical";
} & (
    | {
        /** Selected tab when controlled. */
        value: string;
        defaultValue?: undefined;
      }
    | {
        value?: undefined;
        /** Initially selected tab when uncontrolled. */
        defaultValue: string;
      }
  );

/**
 * Switches between related panels. Inactive panels stay mounted and hidden, so they keep their state.
 * @example
 * ```tsx
 * import { Tab, TabList, TabPanel, Tabs } from '@prava-ui/react/tabs';
 *
 * <Tabs defaultValue="general">
 *   <TabList aria-label="Settings">
 *     <Tab value="general">General</Tab>
 *     <Tab value="billing">Billing</Tab>
 *   </TabList>
 *   <TabPanel value="general">General settings</TabPanel>
 *   <TabPanel value="billing">Billing settings</TabPanel>
 * </Tabs>
 * ```
 */
export function Tabs({
  value: valueProp,
  defaultValue,
  onValueChange,
  activation = "automatic",
  orientation = "horizontal",
  className,
  ...props
}: TabsProps) {
  const [value, setValue] = useControllable(
    valueProp,
    defaultValue ?? "",
    onValueChange,
  );
  const id = useId();
  return (
    <TabsContext.Provider
      value={{ value, setValue, activation, orientation, id }}
    >
      <div
        {...props}
        className={["prava-tabs", className].filter(Boolean).join(" ")}
        data-orientation={orientation}
      />
    </TabsContext.Provider>
  );
}

export type TabListProps = HTMLAttributes<HTMLDivElement>;

/**
 * Holds the Tabs. Name it with `aria-label` or `aria-labelledby`. It scrolls when tabs don't fit.
 * @example
 * ```tsx
 * <TabList aria-label="Settings"><Tab value="general">General</Tab></TabList>
 * ```
 */
export function TabList({
  className,
  children,
  onKeyDown,
  ...props
}: TabListProps) {
  const { value, setValue, activation, orientation } = useTabs();
  const list = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);

  // One bar glides between tabs. Transforms only, and it shows where selection came from.
  useEffect(() => {
    const root = list.current;
    const bar = indicator.current;
    if (!root || !bar) return;
    const sync = () => {
      const tab = root.querySelector<HTMLElement>('[aria-selected="true"]');
      bar.hidden = !tab;
      if (!tab) return;
      // Rects keep sub-pixel accuracy, which offset* rounds away; undo any scale from an animating parent.
      const rootRect = root.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      const unscale = root.offsetWidth / rootRect.width || 1;
      if (orientation === "horizontal") {
        const x = (tabRect.left - rootRect.left) * unscale + root.scrollLeft;
        bar.style.translate = `${x}px 0`;
        bar.style.scale = `${tabRect.width * unscale} 1`;
      } else {
        const y = (tabRect.top - rootRect.top) * unscale + root.scrollTop;
        bar.style.translate = `0 ${y}px`;
        bar.style.scale = `1 ${tabRect.height * unscale}`;
      }
    };
    // Transitions start with the first change of selection, so the first position never animates.
    if (placed.current) bar.dataset.ready = "";
    placed.current = true;
    sync();
    const resize =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(sync);
    resize?.observe(root);
    // A late web font changes tab widths without changing the list's.
    root
      .querySelectorAll('[role="tab"]')
      .forEach((tab) => resize?.observe(tab));
    return () => {
      resize?.disconnect();
    };
  }, [value, orientation]);

  const onListKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    const tabs = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]:not(:disabled)',
      ),
    );
    const index = tabs.indexOf(document.activeElement as HTMLButtonElement);
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const [back, forward] =
      orientation === "vertical"
        ? ["ArrowUp", "ArrowDown"]
        : rtl
          ? ["ArrowRight", "ArrowLeft"]
          : ["ArrowLeft", "ArrowRight"];
    let next: number;
    if (event.key === forward) next = index + 1;
    else if (event.key === back) next = index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    const tab = tabs[(next + tabs.length) % tabs.length];
    tab?.focus();
    if (tab && activation === "automatic" && tab.dataset.value !== undefined)
      setValue(tab.dataset.value);
  };

  return (
    <div
      {...props}
      ref={list}
      role="tablist"
      aria-orientation={orientation}
      className={["prava-tabs__list", className].filter(Boolean).join(" ")}
      onKeyDown={onListKeyDown}
    >
      {children}
      <span
        ref={indicator}
        className="prava-tabs__indicator"
        aria-hidden="true"
      />
    </div>
  );
}

export type TabProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "value" | "type"
> & {
  /** Matches the TabPanel it opens. Keep it stable across languages. */
  value: string;
  /** Decorative icon before the label. */
  icon?: ReactNode;
};

/**
 * One tab. Only the selected tab is in the page's tab order; arrow keys reach the rest.
 * @example
 * ```tsx
 * <Tab value="billing">Billing</Tab>
 * ```
 */
export function Tab({
  value,
  icon,
  className,
  children,
  onClick,
  ...props
}: TabProps) {
  const tabs = useTabs();
  const selected = tabs.value === value;
  return (
    <button
      {...props}
      type="button"
      role="tab"
      id={tabId(tabs.id, value)}
      aria-selected={selected}
      aria-controls={panelId(tabs.id, value)}
      tabIndex={selected ? 0 : -1}
      data-value={value}
      className={["prava-tabs__tab", className].filter(Boolean).join(" ")}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) tabs.setValue(value);
      }}
    >
      {icon != null && (
        <span className="prava-tabs__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
}

export type TabPanelProps = Omit<HTMLAttributes<HTMLDivElement>, "value"> & {
  /** Matches the Tab that opens it. */
  value: string;
};

/**
 * Content for one tab. It's focusable so keyboard users can reach and scroll it.
 * @example
 * ```tsx
 * <TabPanel value="billing">Billing settings</TabPanel>
 * ```
 */
export function TabPanel({ value, className, ...props }: TabPanelProps) {
  const tabs = useTabs();
  return (
    <div
      tabIndex={0}
      {...props}
      role="tabpanel"
      id={panelId(tabs.id, value)}
      aria-labelledby={tabId(tabs.id, value)}
      hidden={tabs.value !== value}
      className={["prava-tabs__panel", className].filter(Boolean).join(" ")}
    />
  );
}
