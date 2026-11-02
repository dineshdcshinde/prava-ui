import { forwardRef, useCallback, useEffect, useRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import {
  bindField,
  onPropertyWrite,
  setRef,
  useField,
  type FieldProps,
} from "../field/field";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> &
  FieldProps<HTMLTextAreaElement> & {
    /** Starting height in lines; the box never gets shorter than this. Defaults to 3. */
    rows?: number;
    /** Height limit in lines; past it the text scrolls. Set equal to `rows` for a fixed height. Defaults to 12. */
    maxRows?: number;
    /** Opt-in native drag handle. Off by default. */
    resize?: "none" | "vertical" | "horizontal" | "both";
  };

const lines = (count: number) => `calc(${count} * 1lh + 1rem + 2px)`; // text + py-2 padding + border

/**
 * A multiline input that grows with its content between `rows` and `maxRows`, with help text and error message.
 * @example
 * ```tsx
 * import { Textarea } from 'prava-ui/textarea';
 * <Textarea aria-label="Message" rows={2} maxRows={6} field={register('message')} />
 * ```
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(rawProps, forwardedRef) {
    const {
      invalid,
      description,
      error,
      rows = 3,
      maxRows = 12,
      resize = "none",
      id,
      className,
      style,
      value,
      onBlur,
      onChange,
      onInvalid,
      ref,
      ...props
    } = bindField<HTMLTextAreaElement, TextareaProps>(rawProps, forwardedRef);
    const field = useField<HTMLTextAreaElement>({
      id,
      description,
      error,
      invalid,
      onBlur,
      onChange,
      onInvalid,
      "aria-describedby": props["aria-describedby"],
      "aria-invalid": props["aria-invalid"],
    });

    const element = useRef<HTMLTextAreaElement | null>(null);
    // Browsers without field-sizing measure by hand; CSS does this everywhere else.
    const measure = useCallback(() => {
      const el = element.current;
      if (!el || globalThis.CSS?.supports?.("field-sizing", "content")) return;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
    }, []);
    const mergedRef = useCallback(
      (el: HTMLTextAreaElement | null) => {
        if (el) {
          element.current = el;
          // react-hook-form's reset and setValue write the property directly, with no event.
          onPropertyWrite(el, "value", measure);
        }
        setRef(ref, el);
      },
      [ref, measure],
    );
    useEffect(measure, [measure, value, rows, maxRows]);

    return (
      <span className="prava-field">
        <textarea
          {...props}
          {...field.controlProps}
          ref={mergedRef}
          rows={rows}
          value={value}
          onChange={(event) => {
            field.controlProps.onChange(event);
            measure();
          }}
          className={["prava-control prava-textarea", className]
            .filter(Boolean)
            .join(" ")}
          data-resize={resize}
          style={{
            minBlockSize: lines(rows),
            maxBlockSize: lines(Math.max(rows, maxRows)),
            ...style,
          }}
        />
        {field.messages}
      </span>
    );
  },
);
