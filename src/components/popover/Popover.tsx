import { useCallback, useEffect, useId, useRef } from "react";
import type {
  FocusEvent,
  HTMLAttributes,
  KeyboardEvent,
  ReactElement,
  ReactNode,
} from "react";
import {
  cloneTrigger,
  useFloating,
  useOutsidePress,
  usePresence,
} from "../../internal/overlay";
import type { FloatingAlign, FloatingPlacement } from "../../internal/overlay";
import { useControllable } from "../../internal/useControllable";

export type PopoverProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  /** Focusable element that toggles the popover, such as a Button. */
  trigger: ReactElement;
  /** Heading that names the popover. Without one, pass `aria-label`. */
  title?: ReactNode;
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
  /** Extra class for the title slot; `className` goes on the floating surface. */
  classNames?: { title?: string };
};

/**
 * Floating content anchored to a trigger. Focus moves in on open and back to the trigger on Escape.
 * A press outside or tabbing away closes it. It doesn't trap focus; use Dialog for that.
 * @example
 * ```tsx
 * import { Popover } from 'prava-ui/popover';
 *
 * <Popover trigger={<Button>Share</Button>} title="Share this project">
 *   <Input label="Link" readOnly value={url} />
 * </Popover>
 * ```
 */
export function Popover({
  trigger,
  title,
  placement = "bottom",
  align = "start",
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  classNames,
  className,
  children,
  id: idProp,
  ...props
}: PopoverProps) {
  const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
  const root = useRef<HTMLSpanElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const mounted = usePresence(open, popup);

  useFloating(open, root, popup, placement, align);
  useOutsidePress(
    open,
    root,
    useCallback(() => setOpen(false), [setOpen]),
  );
  useEffect(() => {
    if (!open) return;
    const el = popup.current;
    const first = el?.querySelector<HTMLElement>(
      "a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex='-1'])",
    );
    (first ?? el)?.focus();
  }, [open]);

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !open || event.defaultPrevented) return;
    event.preventDefault();
    event.stopPropagation(); // Escape must not also close a surrounding dialog
    setOpen(false);
    (root.current?.firstElementChild as HTMLElement | null)?.focus();
  };
  const onBlur = (event: FocusEvent) => {
    const next = event.relatedTarget;
    if (open && next && !root.current?.contains(next)) setOpen(false);
  };

  return (
    <span
      ref={root}
      className="prava-floating-root"
      onKeyDown={onKeyDown}
      onBlur={onBlur}
    >
      {cloneTrigger(trigger, {
        "aria-haspopup": "dialog",
        "aria-expanded": open,
        "aria-controls": id,
        onClick: () => setOpen(!open),
      })}
      <div
        role="dialog"
        tabIndex={-1}
        aria-labelledby={title != null ? `${id}-title` : undefined}
        {...props}
        ref={popup}
        id={id}
        popover="manual"
        className={["prava-floating prava-popover", className]
          .filter(Boolean)
          .join(" ")}
        data-open={open ? "" : undefined}
      >
        {mounted && (
          <>
            {title != null && (
              <div
                id={`${id}-title`}
                className={["prava-popover__title", classNames?.title]
                  .filter(Boolean)
                  .join(" ")}
              >
                {title}
              </div>
            )}
            {children}
          </>
        )}
      </div>
    </span>
  );
}
