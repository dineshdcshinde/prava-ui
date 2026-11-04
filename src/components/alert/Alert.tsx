import { forwardRef } from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { usePravaConfig } from "../provider/PravaProvider";

export type AlertProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  /** Semantic color and default icon. */
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
  /** Short summary shown in bold above the message. */
  title?: ReactNode;
  /** Replaces the tone's icon; pass `null` to show none. */
  icon?: ReactNode;
  /** Controls for this message, such as a Button. They wrap below the text when space is tight. */
  action?: ReactNode;
  /** Shows a dismiss button and is called when it is pressed. Hiding the Alert stays with you. */
  onDismiss?: () => void;
};

const paths = {
  neutral: "M8 7.25v3.5M8 5.25h.01M14 8A6 6 0 1 1 2 8a6 6 0 0 1 12 0z",
  info: "M8 7.25v3.5M8 5.25h.01M14 8A6 6 0 1 1 2 8a6 6 0 0 1 12 0z",
  success: "M5.25 8.25 7.25 10.25 10.75 6M14 8A6 6 0 1 1 2 8a6 6 0 0 1 12 0z",
  warning:
    "M8 6.25v3M8 11.25h.01M7.13 2.75 1.9 12a1 1 0 0 0 .87 1.5h10.46a1 1 0 0 0 .87-1.5L8.87 2.75a1 1 0 0 0-1.74 0z",
  danger: "M8 5v3.75M8 11h.01M14 8A6 6 0 1 1 2 8a6 6 0 0 1 12 0z",
};

/**
 * Contextual feedback that stays until the page removes it. `role="status"` is polite;
 * pass `role="alert"` only when the message must interrupt.
 * @example
 * ```tsx
 * import { Alert } from 'prava-ui/alert';
 *
 * <Alert tone="warning" title="Storage almost full">Upgrade to keep uploading files.</Alert>
 * ```
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(function Alert(
  {
    tone = "neutral",
    title,
    icon,
    action,
    onDismiss,
    className,
    children,
    ...props
  },
  ref,
) {
  const { messages } = usePravaConfig();
  return (
    <div
      role="status"
      {...props}
      ref={ref}
      className={["prava-alert", className].filter(Boolean).join(" ")}
      data-tone={tone}
      data-dismissible={onDismiss ? "" : undefined}
    >
      {icon !== null && (
        <span className="prava-alert__icon" aria-hidden="true">
          {icon ?? (
            <svg viewBox="0 0 16 16">
              <path d={paths[tone]} />
            </svg>
          )}
        </span>
      )}
      <div className="prava-alert__body">
        {title != null && <div className="prava-alert__title">{title}</div>}
        {children != null && (
          <div className="prava-alert__description">{children}</div>
        )}
      </div>
      {action != null && <div className="prava-alert__action">{action}</div>}
      {onDismiss && (
        <button
          type="button"
          className="prava-alert__dismiss"
          aria-label={messages.dismiss}
          onClick={onDismiss}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      )}
    </div>
  );
});
