import { cloneElement, useId } from "react";
import type { HTMLAttributes, ReactElement, ReactNode } from "react";
import { Label } from "../label";

type AssociatedControlProps = {
  id?: string;
  required?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false" | "grammar" | "spelling";
  "aria-required"?: boolean | "true" | "false";
};

export type FormFieldProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  /** Accessible label rendered above the control. */
  label: ReactNode;
  /** A single native or Prava form control to associate with this field. */
  control: ReactElement<AssociatedControlProps>;
  /** Optional explanatory text associated with the control. */
  description?: ReactNode;
  /** Optional validation message associated with and announced by the control. */
  error?: ReactNode;
  /** Marks the control required and adds the readable cue to the label. */
  required?: boolean;
  /** Stable control ID; generated when omitted. */
  id?: string;
};

/**
 * Composes a label, control, help text, and error with stable accessible associations.
 * @example
 * ```tsx
 * import { FormField } from 'prava-ui/form-field';
 * import { Input } from 'prava-ui/input';
 * <FormField label="Email" required control={<Input type="email" />} />
 * ```
 */
export function FormField({
  label,
  control,
  description,
  error,
  required = false,
  id,
  className,
  ...props
}: FormFieldProps) {
  const generatedId = useId();
  const controlId = id ?? control.props.id ?? generatedId;
  const descriptionId = description ? `${controlId}-description` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const controlProps = control.props;
  const describedBy =
    [controlProps["aria-describedby"], descriptionId, errorId]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div
      {...props}
      className={["prava-form-field", className].filter(Boolean).join(" ")}
    >
      <Label htmlFor={controlId} required={required}>
        {label}
      </Label>
      {cloneElement(control, {
        id: controlProps.id ?? controlId,
        required: required || controlProps.required,
        "aria-required": required || controlProps["aria-required"],
        "aria-invalid": error ? true : controlProps["aria-invalid"],
        "aria-describedby": describedBy,
      })}
      {description && (
        <div id={descriptionId} className="prava-form-field__description">
          {description}
        </div>
      )}
      {error && (
        <div id={errorId} className="prava-form-field__error">
          {error}
        </div>
      )}
    </div>
  );
}
