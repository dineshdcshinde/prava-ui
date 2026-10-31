import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** Marks the textarea invalid and sets `aria-invalid`. */
  invalid?: boolean;
  /** Controls the native resize handle. Defaults to vertical resizing. */
  resize?: "none" | "vertical" | "horizontal" | "both";
};

/**
 * A native multiline input that grows by its rows and keeps browser resizing explicit.
 * @example
 * ```tsx
 * import { Textarea } from 'prava-ui/textarea';
 * <Textarea aria-label="Message" rows={4} resize="vertical" />
 * ```
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { invalid = false, resize = "vertical", className, style, ...props },
    ref,
  ) {
    return (
      <textarea
        {...props}
        ref={ref}
        className={["prava-textarea", className].filter(Boolean).join(" ")}
        data-invalid={invalid || undefined}
        aria-invalid={invalid || props["aria-invalid"]}
        data-resize={resize}
        style={style}
      />
    );
  },
);
