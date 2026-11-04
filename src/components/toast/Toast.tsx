import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { usePresence } from "../../internal/overlay";
import { Alert } from "../alert";
import type { AlertProps } from "../alert";
import { usePravaConfig } from "../provider/PravaProvider";

export type ToastOptions = {
  /** Reuse an id to update a toast in place, such as "Saving" to "Saved". */
  id?: string;
  /** Short summary in bold. */
  title?: ReactNode;
  /** Supporting text. */
  description?: ReactNode;
  /** Semantic color. `danger` announces at once and stays until dismissed. */
  tone?: AlertProps["tone"];
  /** Control for this toast, such as an Undo Button. */
  action?: ReactNode;
  /**
   * Milliseconds on screen, paused while hovered, focused, or in a hidden tab. Defaults to 5000,
   * 10000 with an `action`, and `Infinity` (stays until dismissed) for `danger`.
   */
  duration?: number;
};

type Item = ToastOptions & { id: string; open: boolean };

let toasts: readonly Item[] = [];
let nextId = 0;
const listeners = new Set<() => void>();
const write = (next: readonly Item[]) => {
  toasts = next;
  listeners.forEach((listener) => listener());
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const snapshot = () => toasts;
const none: readonly Item[] = [];
const serverSnapshot = () => none;

/**
 * Shows a toast through the page's `<Toaster />` and returns its id.
 * @example
 * ```tsx
 * import { toast } from 'prava-ui/toast';
 *
 * toast({ title: 'Invitation sent', tone: 'success' });
 * ```
 */
export function toast(options: ToastOptions) {
  const id = options.id ?? `prava-toast-${++nextId}`;
  const item: Item = { ...options, id, open: true };
  write(
    toasts.some((t) => t.id === id)
      ? toasts.map((t) => (t.id === id ? item : t))
      : [...toasts, item],
  );
  return id;
}

/**
 * Dismisses one toast, or every toast when called with no id.
 * @example
 * ```tsx
 * import { dismissToast } from 'prava-ui/toast';
 *
 * dismissToast(id);
 * ```
 */
export function dismissToast(id?: string) {
  write(
    toasts.map((t) =>
      id === undefined || t.id === id ? { ...t, open: false } : t,
    ),
  );
}

const durationOf = ({ duration, tone, action }: ToastOptions) =>
  duration ?? (tone === "danger" ? Infinity : action != null ? 10000 : 5000);

function ToastItem({ item, paused }: { item: Item; paused: boolean }) {
  const ref = useRef<HTMLLIElement>(null);
  const duration = durationOf(item);
  const remaining = useRef(duration);
  const mounted = usePresence(item.open, ref);

  // Updating a toast in place restarts its time.
  useEffect(() => {
    remaining.current = duration;
  }, [item, duration]);

  useEffect(() => {
    if (paused || !item.open || remaining.current === Infinity) return;
    const started = Date.now();
    const timer = setTimeout(() => dismissToast(item.id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - started;
    };
  }, [paused, item]);

  useEffect(() => {
    if (!mounted) write(toasts.filter((t) => t.id !== item.id));
  }, [mounted, item.id]);

  return (
    <li
      ref={ref}
      className="prava-toast"
      data-open={item.open ? "" : undefined}
    >
      <div className="prava-toast__clip">
        {/* Announced by the Toaster's live regions, so it isn't a live region of its own. */}
        <Alert
          role="group"
          tone={item.tone}
          title={item.title}
          action={item.action}
          onDismiss={() => dismissToast(item.id)}
        >
          {item.description}
        </Alert>
      </div>
    </li>
  );
}

export type ToasterProps = HTMLAttributes<HTMLDivElement> & {
  /** Screen corner or edge. `start` and `end` follow the text direction. */
  placement?:
    | "top-start"
    | "top-center"
    | "top-end"
    | "bottom-start"
    | "bottom-center"
    | "bottom-end";
};

/**
 * Renders the toasts started with `toast()`. Place one near your app's root, inside `PravaProvider`.
 * shortcut: a modal Dialog makes everything outside it inert, so toasts show above it but can't
 * be pressed or announced until it closes. Upgrade by rendering a Toaster inside that Dialog.
 * @example
 * ```tsx
 * import { Toaster } from 'prava-ui/toast';
 *
 * <Toaster placement="bottom-end" />
 * ```
 */
export function Toaster({
  placement = "bottom-end",
  className,
  ...props
}: ToasterProps) {
  const { messages } = usePravaConfig();
  const items = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const region = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hiddenTab, setHiddenTab] = useState(false);

  useEffect(() => {
    const onVisibility = () => setHiddenTab(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Re-entering the top layer lifts the stack above any Dialog opened since the last toast.
  const count = items.length;
  useEffect(() => {
    const el = region.current;
    if (!el) return;
    if (el.matches?.(":popover-open")) el.hidePopover();
    if (count > 0) el.showPopover?.();
  }, [count]);

  const announce = (urgent: boolean) =>
    items
      .filter((item) => item.open && (item.tone === "danger") === urgent)
      .map((item) => (
        <div key={item.id}>
          {item.title} {item.description}
        </div>
      ));

  return (
    <>
      {/* Always in the DOM: a live region must exist before its text arrives to be announced. */}
      <div role="status" className="prava-toaster__announce">
        {announce(false)}
      </div>
      <div role="alert" className="prava-toaster__announce">
        {announce(true)}
      </div>
      <div
        role="region"
        aria-label={messages.notifications}
        {...props}
        ref={region}
        popover="manual"
        className={["prava-toaster", className].filter(Boolean).join(" ")}
        data-placement={placement}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      >
        <ol className="prava-toaster__list">
          {items.map((item) => (
            <ToastItem
              key={item.id}
              item={item}
              paused={hovered || focused || hiddenTab}
            />
          ))}
        </ol>
      </div>
    </>
  );
}
