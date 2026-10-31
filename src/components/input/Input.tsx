import { forwardRef, useId, useState } from "react";
import type { FocusEvent, InputHTMLAttributes, ReactNode } from "react";

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  /** Selects the input's compact, default, or spacious dimensions; numbers preserve the native HTML size attribute. */
  size?: "sm" | "md" | "lg" | number;
  /** Marks the input as invalid and sets aria-invalid. */
  invalid?: boolean;
  /** Optional visible label that floats above the value when focused or filled. */
  label?: ReactNode;
  /** Decorative content positioned at the input's inline start. */
  leftIcon?: ReactNode;
  /** Decorative content positioned at the input's inline end. */
  rightIcon?: ReactNode;
  /** Explains why a disabled input is unavailable. */
  disabledReason?: string;
};

/** A native, single-line input with an optional floating label. */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    size = "md",
    invalid = false,
    label,
    leftIcon,
    rightIcon,
    disabledReason,
    id,
    value,
    defaultValue,
    onChange,
    onFocus,
    onBlur,
    className,
    ...props
  }: InputProps,
  ref,
) {
  const generatedId = useId();
  const hasLabel = Boolean(label);
  const inputId = id ?? (hasLabel ? generatedId : undefined);
  const reasonId =
    props.disabled && disabledReason
      ? `${generatedId}-disabled-reason`
      : undefined;
  const [focused, setFocused] = useState(false);
  const [uncontrolledFilled, setUncontrolledFilled] = useState(
    () => String(defaultValue ?? "").length > 0,
  );
  const sizeVariant = typeof size === "number" ? "md" : size;
  const filled =
    value !== undefined ? String(value ?? "").length > 0 : uncontrolledFilled;
  const floated = focused || filled;
  const describedBy =
    [props["aria-describedby"], reasonId].filter(Boolean).join(" ") ||
    undefined;

  return (
    <span className="prava-input-field">
      <span
        className="prava-input__control"
        data-has-left-icon={leftIcon != null || undefined}
        data-has-right-icon={rightIcon != null || undefined}
      >
        <input
          {...props}
          ref={ref}
          id={inputId}
          value={value}
          defaultValue={defaultValue}
          size={typeof size === "number" ? size : undefined}
          className={["prava-input", className].filter(Boolean).join(" ")}
          data-size={sizeVariant}
          data-has-label={hasLabel || undefined}
          data-floated={(hasLabel && floated) || undefined}
          data-invalid={invalid || undefined}
          aria-invalid={invalid || props["aria-invalid"]}
          aria-describedby={describedBy}
          onChange={(event) => {
            if (value === undefined)
              setUncontrolledFilled(event.currentTarget.value.length > 0);
            onChange?.(event);
          }}
          onFocus={(event: FocusEvent<HTMLInputElement>) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event: FocusEvent<HTMLInputElement>) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
        {leftIcon != null && (
          <span
            className="prava-input__icon prava-input__icon--start"
            aria-hidden="true"
          >
            {leftIcon}
          </span>
        )}
        {rightIcon != null && (
          <span
            className="prava-input__icon prava-input__icon--end"
            aria-hidden="true"
          >
            {rightIcon}
          </span>
        )}
        {hasLabel && (
          <label className="prava-input__label" htmlFor={inputId}>
            {label}
          </label>
        )}
      </span>
      {reasonId && (
        <span className="prava-input__disabled-reason" id={reasonId}>
          {disabledReason}
        </span>
      )}
    </span>
  );
});
