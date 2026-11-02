import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { bindField, useField, type FieldProps } from "../field/field";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> &
  FieldProps & {
    /** Selects the input's compact, default, or spacious dimensions; numbers preserve the native HTML size attribute. */
    size?: "sm" | "md" | "lg" | number;
    /** Optional visible label that floats above the value when focused or filled. */
    label?: ReactNode;
    /** Decorative content positioned at the input's inline start. */
    startIcon?: ReactNode;
    /** Decorative content positioned at the input's inline end. */
    endIcon?: ReactNode;
    /** Explains why a disabled input is unavailable; shown in place of `description` while disabled. */
    disabledReason?: string;
  };

/**
 * A native, single-line input with an optional floating label, help text, and error message.
 * Connect react-hook-form with `field={register("name")}` and pass `errors.name?.message` to `error`.
 * @example
 * ```tsx
 * import { Input } from 'prava-ui/input';
 * <Input label="Email" type="email" required description="We never share it." />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(rawProps, forwardedRef) {
    const {
      size = "md",
      invalid,
      label,
      startIcon,
      endIcon,
      disabledReason,
      description,
      error,
      id,
      placeholder,
      className,
      onBlur,
      onChange,
      onInvalid,
      ref,
      ...props
    } = bindField<HTMLInputElement, InputProps>(rawProps, forwardedRef);
    const hasLabel = Boolean(label);
    const field = useField<HTMLInputElement>({
      id,
      description:
        props.disabled && disabledReason ? disabledReason : description,
      error,
      invalid,
      onBlur,
      onChange,
      onInvalid,
      "aria-describedby": props["aria-describedby"],
      "aria-invalid": props["aria-invalid"],
    });

    return (
      <span className="prava-field prava-input-field">
        <span
          className="prava-input__control"
          data-has-start-icon={startIcon != null || undefined}
          data-has-end-icon={endIcon != null || undefined}
        >
          <input
            {...props}
            {...field.controlProps}
            ref={ref}
            // The label floats from CSS :placeholder-shown, so ref-set values (react-hook-form, autofill) float it too.
            placeholder={hasLabel ? (placeholder ?? " ") : placeholder}
            size={typeof size === "number" ? size : undefined}
            className={["prava-control prava-input", className]
              .filter(Boolean)
              .join(" ")}
            data-size={typeof size === "number" ? "md" : size}
            data-has-label={hasLabel || undefined}
          />
          {startIcon != null && (
            <span
              className="prava-input__icon prava-input__icon--start"
              aria-hidden="true"
            >
              {startIcon}
            </span>
          )}
          {endIcon != null && (
            <span
              className="prava-input__icon prava-input__icon--end"
              aria-hidden="true"
            >
              {endIcon}
            </span>
          )}
          {hasLabel && (
            <label className="prava-input__label" htmlFor={field.id}>
              {label}
            </label>
          )}
        </span>
        {field.messages}
      </span>
    );
  },
);
