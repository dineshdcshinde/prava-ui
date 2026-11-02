import { forwardRef, useCallback, useEffect, useRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import {
  bindField,
  Choice,
  setRef,
  useField,
  type FieldProps,
} from "../field/field";

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> &
  FieldProps & {
    /** Visible label; clicking it toggles the checkbox. */
    label?: ReactNode;
    /** Shows the mixed state (for "select all"); exposed natively as `aria-checked="mixed"`. */
    indeterminate?: boolean;
  };

/**
 * A native checkbox with a painted indicator, label, help text, and error message.
 * `className` and `style` apply to the label row; everything else reaches the native input.
 * @example
 * ```tsx
 * import { Checkbox } from 'prava-ui/checkbox';
 * <Checkbox label="Email me product updates" field={register('updates')} />
 * ```
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox(rawProps, forwardedRef) {
    const {
      label,
      indeterminate = false,
      description,
      error,
      invalid,
      id,
      onBlur,
      onChange,
      onInvalid,
      ref,
      ...props
    } = bindField<HTMLInputElement, CheckboxProps>(
      rawProps,
      forwardedRef,
      "checked",
    );
    const input = useRef<HTMLInputElement | null>(null);
    useEffect(() => {
      if (input.current) input.current.indeterminate = indeterminate;
    }, [indeterminate]);
    const mergedRef = useCallback(
      (el: HTMLInputElement | null) => {
        input.current = el;
        setRef(ref, el);
      },
      [ref],
    );
    const field = useField<HTMLInputElement>({
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
    return (
      <span className="prava-field" data-choice="">
        <Choice
          {...props}
          {...field.controlProps}
          ref={mergedRef}
          kind="checkbox"
          label={label}
        />
        {field.messages}
      </span>
    );
  },
);
