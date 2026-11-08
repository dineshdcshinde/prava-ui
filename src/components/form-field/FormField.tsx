import { cloneElement } from "react";
import type {
  AriaAttributes,
  ChangeEventHandler,
  FocusEventHandler,
  FormEventHandler,
  HTMLAttributes,
  ReactElement,
  ReactNode,
} from "react";
import { FieldContext, useField, type FieldControl } from "../field/field";
import { Label } from "../label";

type AssociatedControlProps = {
  id?: string;
  type?: string;
  className?: string;
  "data-size"?: string;
  required?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: AriaAttributes["aria-invalid"];
  "aria-required"?: AriaAttributes["aria-required"];
  onBlur?: FocusEventHandler<FieldControl>;
  onChange?: ChangeEventHandler<FieldControl>;
  onInvalid?: FormEventHandler<FieldControl>;
};

// Native inputs that are not text boxes keep their own look.
const nonTextInputs = new Set([
  "checkbox",
  "radio",
  "range",
  "file",
  "color",
  "hidden",
  "submit",
  "reset",
  "button",
  "image",
]);

export type FormFieldProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  /** Accessible label rendered above the control. */
  label: ReactNode;
  /** A single native or Prava form control to associate with this field. Native text inputs, textareas, and selects get Prava's control styling. */
  control: ReactElement<AssociatedControlProps>;
  /** Optional explanatory text associated with the control. */
  description?: ReactNode;
  /** Validation message associated with the control; replaces built-in validation text. */
  error?: ReactNode;
  /** Marks the control required and adds the readable cue to the label. */
  required?: boolean;
  /** Stable control ID; generated when omitted. */
  id?: string;
};

/**
 * Composes a label, any control, help text, and error with stable accessible associations.
 * Native and Prava controls both get localized validation messages here.
 * @example
 * ```tsx
 * import { FormField } from 'prava-ui/form-field';
 * import { Input } from 'prava-ui/input';
 * <FormField label="Email" required error={errors.email?.message} control={<Input type="email" field={register('email')} />} />
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
  const c = control.props;
  const nativeText =
    control.type === "textarea" ||
    control.type === "select" ||
    (control.type === "input" && !nonTextInputs.has(c.type ?? "text"));
  const field = useField({
    id: id ?? c.id,
    description,
    error,
    onBlur: c.onBlur,
    onChange: c.onChange,
    onInvalid: c.onInvalid,
    "aria-describedby": c["aria-describedby"],
    "aria-invalid": c["aria-invalid"],
  });

  return (
    <div
      {...props}
      className={["prava-field prava-form-field", className]
        .filter(Boolean)
        .join(" ")}
    >
      <Label htmlFor={field.id} required={required}>
        {label}
      </Label>
      <FieldContext.Provider value>
        {cloneElement(control, {
          ...field.controlProps,
          required: required || c.required,
          "aria-required": required || c["aria-required"],
          ...(nativeText && {
            className: ["prava-control", c.className].filter(Boolean).join(" "),
            "data-size": c["data-size"] ?? "md",
          }),
        })}
      </FieldContext.Provider>
      {field.messages}
    </div>
  );
}
