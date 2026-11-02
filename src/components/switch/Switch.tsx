import { forwardRef } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { bindField, Choice, useField, type FieldProps } from "../field/field";

export type SwitchProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "size"
> &
  FieldProps & {
    /** Visible label; clicking it toggles the switch. */
    label?: ReactNode;
  };

/**
 * An on/off setting that applies immediately: a native checkbox with `role="switch"`, so Space toggles it.
 * Use Checkbox for choices that are submitted later.
 * @example
 * ```tsx
 * import { Switch } from 'prava-ui/switch';
 * <Switch label="Dark mode" checked={dark} onChange={(e) => setDark(e.target.checked)} />
 * ```
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  function Switch(rawProps, forwardedRef) {
    const {
      label,
      description,
      error,
      invalid,
      id,
      onBlur,
      onChange,
      onInvalid,
      ref,
      ...props
    } = bindField<HTMLInputElement, SwitchProps>(
      rawProps,
      forwardedRef,
      "checked",
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
      <span className="prava-field" data-choice="switch">
        <Choice
          {...props}
          {...field.controlProps}
          ref={ref}
          kind="switch"
          label={label}
        />
        {field.messages}
      </span>
    );
  },
);
