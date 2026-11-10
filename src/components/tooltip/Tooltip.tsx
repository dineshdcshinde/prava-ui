import { useCallback, useEffect, useId, useRef, useState } from "react";
import type {
  FocusEvent,
  HTMLAttributes,
  KeyboardEvent,
  PointerEvent,
  ReactElement,
  ReactNode,
} from "react";
import {
  cloneTrigger,
  useFloating,
  useOutsidePress,
} from "../../internal/overlay";
import type { FloatingPlacement } from "../../internal/overlay";

export type TooltipProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "content" | "children"
> & {
  /** Short plain text. Don't put links, buttons, or anything essential here. */
  content: ReactNode;
  /** The focusable element it describes. */
  children: ReactElement;
  /** Milliseconds to wait on hover before showing. Keyboard focus shows it at once. */
  delay?: number;
  /** Preferred side. It flips when there's no room; `start` and `end` follow the text direction. */
  placement?: FloatingPlacement;
};

// Long enough to cross the gap from trigger to tooltip, so people can hover it to read or zoom.
const HIDE_DELAY = 100;

/**
 * Short supplementary text shown on hover, keyboard focus, or tap, and hidden on Escape.
 * @example
 * ```tsx
 * import { Tooltip } from '@prava-ui/react/tooltip';
 *
 * <Tooltip content="Visible to your whole team"><Button>Publish</Button></Tooltip>
 * ```
 */
export function Tooltip({
  content,
  children,
  delay = 400,
  placement = "top",
  className,
  id: idProp,
  ...props
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLSpanElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const generatedId = useId();
  const id = idProp ?? generatedId;

  const schedule = useCallback((next: boolean, wait: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(next), wait);
  }, []);
  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setOpen(false);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  useFloating(open, root, popup, placement, "center");
  useOutsidePress(open, root, hide);

  const handlers = {
    onPointerEnter: (event: PointerEvent) => {
      if (event.pointerType === "mouse") schedule(true, open ? 0 : delay);
    },
    onPointerLeave: (event: PointerEvent) => {
      if (event.pointerType === "mouse") schedule(false, HIDE_DELAY);
    },
    // Touch has no hover: a tap shows it, and a press elsewhere hides it.
    onPointerUp: (event: PointerEvent) => {
      if (event.pointerType !== "mouse") {
        clearTimeout(timer.current);
        setOpen(true);
      }
    },
    onFocus: (event: FocusEvent) => {
      if (event.target.matches?.(":focus-visible")) {
        clearTimeout(timer.current);
        setOpen(true);
      }
    },
    onBlur: hide,
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !open) return;
      // Only this tooltip closes, so a Dialog around it stays open.
      event.preventDefault();
      event.stopPropagation();
      hide();
    },
  };

  return (
    <span ref={root} className="prava-floating-root" {...handlers}>
      {cloneTrigger(children, { "aria-describedby": id })}
      <div
        {...props}
        ref={popup}
        id={id}
        role="tooltip"
        popover="manual"
        className={["prava-floating prava-tooltip", className]
          .filter(Boolean)
          .join(" ")}
        data-open={open ? "" : undefined}
      >
        {content}
      </div>
    </span>
  );
}
