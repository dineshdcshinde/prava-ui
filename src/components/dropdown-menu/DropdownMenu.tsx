import { useCallback, useId, useRef } from "react";
import type {
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  ReactElement,
  ReactNode,
} from "react";
import {
  cloneTrigger,
  useFloating,
  useOutsidePress,
} from "../../internal/overlay";
import type { FloatingAlign, FloatingPlacement } from "../../internal/overlay";
import { useControllable } from "../../internal/useControllable";

export type DropdownMenuAction = {
  /** What people see; pass translated text or a node. */
  label: ReactNode;
  /** Runs when the item is chosen, after the menu closes and focus returns to the trigger. */
  onSelect?: () => void;
  /** Renders the item as a link. */
  href?: string;
  /** Decorative icon before the label. */
  icon?: ReactNode;
  /** Stays reachable by keyboard so people can discover it, but can't be chosen. */
  disabled?: boolean;
  /** `danger` marks a destructive action. */
  tone?: "default" | "danger";
};
export type DropdownMenuSeparator = { separator: true };
export type DropdownMenuGroup = {
  /** Group heading; pass translated text or a node. */
  label: ReactNode;
  items: readonly DropdownMenuAction[];
};
export type DropdownMenuItem =
  DropdownMenuAction | DropdownMenuSeparator | DropdownMenuGroup;

export type DropdownMenuProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  /** Focusable element that opens the menu, such as a Button. */
  trigger: ReactElement;
  /** Actions, `{ separator: true }` dividers, and `{ label, items }` groups. */
  items: readonly DropdownMenuItem[];
  /** Preferred side. It flips when there's no room; `start` and `end` follow the text direction. */
  placement?: FloatingPlacement;
  /** Alignment against the trigger along that side. */
  align?: FloatingAlign;
  /** Open state when controlled. */
  open?: boolean;
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean;
  /** Called with the next state when it asks to open or close. */
  onOpenChange?: (open: boolean) => void;
};

const TYPE_AHEAD_RESET = 500;

/**
 * A list of actions opened from a trigger, following the WAI-ARIA menu button pattern.
 * For choosing a value, use Select.
 * @example
 * ```tsx
 * import { DropdownMenu } from 'prava-ui/dropdown-menu';
 *
 * <DropdownMenu
 *   trigger={<Button variant="outline">Actions</Button>}
 *   items={[
 *     { label: 'Rename', onSelect: rename },
 *     { separator: true },
 *     { label: 'Delete', tone: 'danger', onSelect: remove },
 *   ]}
 * />
 * ```
 */
export function DropdownMenu({
  trigger,
  items,
  placement = "bottom",
  align = "start",
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  className,
  id: idProp,
  ...props
}: DropdownMenuProps) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const root = useRef<HTMLSpanElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const triggerProps = (trigger as ReactElement<{ id?: string }>).props;
  const triggerId = triggerProps.id ?? `${id}-trigger`;
  const typed = useRef({ text: "", at: 0 });

  useFloating(open, root, popup, placement, align);
  useOutsidePress(
    open,
    root,
    useCallback(() => setOpen(false), [setOpen]),
  );

  const menuItems = () =>
    Array.from(
      popup.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
  const triggerEl = () => root.current?.firstElementChild as HTMLElement | null;

  // A closed popup can't take focus, so wait for the open state to reach the DOM.
  const openAndFocus = (target: "first" | "last" | "menu") => {
    setOpen(true);
    requestAnimationFrame(() => {
      const list = menuItems();
      const next =
        target === "menu"
          ? popup.current
          : target === "first"
            ? list[0]
            : list[list.length - 1];
      next?.focus();
    });
  };

  const close = () => {
    setOpen(false);
    triggerEl()?.focus();
  };

  const moveByTyping = (char: string) => {
    const now = Date.now();
    const state = typed.current;
    state.text = now - state.at > TYPE_AHEAD_RESET ? char : state.text + char;
    state.at = now;
    const list = menuItems();
    const from = list.indexOf(document.activeElement as HTMLElement);
    // A repeated letter steps through matches; a longer prefix stays on the current one.
    const search = state.text.split("").every((c) => c === char)
      ? char
      : state.text;
    const offset = search.length > 1 ? 0 : 1;
    const ordered = [
      ...list.slice(from + offset),
      ...list.slice(0, from + offset),
    ];
    ordered
      .find((item) => item.textContent?.trim().toLowerCase().startsWith(search))
      ?.focus();
  };

  const onMenuKeyDown = (event: KeyboardEvent) => {
    const list = menuItems();
    const index = list.indexOf(document.activeElement as HTMLElement);
    const focus = (next: number) =>
      list[(next + list.length) % list.length]?.focus();
    const keys: Record<string, () => void> = {
      ArrowDown: () => focus(index + 1),
      ArrowUp: () => focus(index < 0 ? -1 : index - 1),
      Home: () => focus(0),
      End: () => focus(-1),
      Escape: close,
    };
    const action = keys[event.key];
    if (action) {
      event.preventDefault();
      event.stopPropagation(); // Escape must not also close a surrounding dialog
      action();
    } else if (event.key === "Tab") {
      // Focus goes back first, so Tab continues from the trigger's place in the page.
      setOpen(false);
      triggerEl()?.focus();
    } else if (
      event.key.length === 1 &&
      event.key !== " " &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      moveByTyping(event.key.toLowerCase());
    }
  };

  const renderAction = (item: DropdownMenuAction, key: string) => {
    const shared = {
      role: "menuitem",
      tabIndex: -1,
      className: "prava-dropdown-menu__item",
      "data-tone": item.tone === "danger" ? "danger" : undefined,
      "aria-disabled": item.disabled || undefined,
      onClick: (event: MouseEvent) => {
        if (item.disabled) {
          event.preventDefault();
          return;
        }
        close();
        item.onSelect?.();
      },
      // Hover and keyboard share one highlight, so only one row ever looks active.
      onPointerMove: (event: PointerEvent<HTMLElement>) => {
        if (event.pointerType === "mouse") event.currentTarget.focus();
      },
    };
    const content = (
      <>
        {item.icon != null && (
          <span className="prava-dropdown-menu__icon" aria-hidden="true">
            {item.icon}
          </span>
        )}
        <span className="prava-dropdown-menu__label">{item.label}</span>
      </>
    );
    return item.href ? (
      <a key={key} {...shared} href={item.disabled ? undefined : item.href}>
        {content}
      </a>
    ) : (
      <button key={key} type="button" {...shared}>
        {content}
      </button>
    );
  };

  return (
    <span ref={root} className="prava-floating-root">
      {cloneTrigger(trigger, {
        id: triggerId,
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-controls": id,
        // detail is 0 for Enter and Space, which land on the first item; a pointer lands on the menu.
        onClick: (event: MouseEvent) => {
          if (open) setOpen(false);
          else openAndFocus(event.detail === 0 ? "first" : "menu");
        },
        onKeyDown: (event: KeyboardEvent) => {
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
          event.preventDefault();
          openAndFocus(event.key === "ArrowDown" ? "first" : "last");
        },
      })}
      <div
        aria-labelledby={triggerId}
        {...props}
        ref={popup}
        id={id}
        role="menu"
        tabIndex={-1}
        popover="manual"
        className={["prava-floating prava-dropdown-menu", className]
          .filter(Boolean)
          .join(" ")}
        data-open={open ? "" : undefined}
        onKeyDown={onMenuKeyDown}
        onPointerLeave={() => popup.current?.focus()}
      >
        {items.map((item, index) => {
          if ("separator" in item)
            return (
              <div
                key={index}
                role="separator"
                className="prava-dropdown-menu__separator"
              />
            );
          if ("items" in item)
            return (
              <div
                key={index}
                role="group"
                aria-labelledby={`${id}-group-${index}`}
              >
                <div
                  id={`${id}-group-${index}`}
                  className="prava-dropdown-menu__group-label"
                >
                  {item.label}
                </div>
                {item.items.map((action, inner) =>
                  renderAction(action, `${index}-${inner}`),
                )}
              </div>
            );
          return renderAction(item, String(index));
        })}
      </div>
    </span>
  );
}
