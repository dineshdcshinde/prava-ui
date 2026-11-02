import { forwardRef, useId } from "react";
import type {
  ChangeEventHandler,
  CSSProperties,
  FocusEventHandler,
  ReactNode,
} from "react";
import { usePravaConfig } from "../provider/PravaProvider";
import { bindField, Choice, useField, type FieldProps } from "../field/field";

export type RadioOption = {
  value: string;
  label: ReactNode;
  disabled?: boolean;
};

export type RadioGroupProps = FieldProps & {
  /** Group label, rendered as the fieldset legend. */
  label: ReactNode;
  options: RadioOption[];
  /** Shared input name; generated when omitted. */
  name?: string;
  value?: string;
  defaultValue?: string;
  /** Native change event from the selected radio (react-hook-form's `register` uses this). */
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  /** Called with the newly selected option value. */
  onValueChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  /** Stacks options (default) or lays them out in a wrapping row. */
  orientation?: "vertical" | "horizontal";
  id?: string;
  className?: string;
  style?: CSSProperties;
};

/**
 * One choice from a set, built from native radios so arrow keys move and select as browsers expect.
 * Connect it with `field={register("plan")}` or Controller's `field={field}`.
 * @example
 * ```tsx
 * import { RadioGroup } from 'prava-ui/radio-group';
 * <RadioGroup label="Plan" options={[{ value: 'free', label: 'Free' }, { value: 'pro', label: 'Pro' }]} field={register('plan')} />
 * ```
 */
export const RadioGroup = forwardRef<HTMLInputElement, RadioGroupProps>(
  function RadioGroup(rawProps, forwardedRef) {
    const {
      label,
      options,
      name,
      value,
      defaultValue,
      onChange,
      onBlur,
      onValueChange,
      required = false,
      disabled,
      orientation = "vertical",
      description,
      error,
      invalid,
      id,
      className,
      style,
      ref,
    } = bindField<HTMLInputElement, RadioGroupProps>(rawProps, forwardedRef);
    // Controller keeps a single ref, used to focus the group on error; register needs every radio.
    const controller = rawProps.field && "value" in rawProps.field;
    const { messages } = usePravaConfig();
    const generatedName = useId();
    const field = useField<HTMLInputElement>({
      id,
      description,
      error,
      invalid,
      onBlur,
      onChange: (event) => {
        onChange?.(event);
        onValueChange?.(event.currentTarget.value);
      },
    });
    const {
      id: groupId,
      "aria-invalid": ariaInvalid,
      "aria-describedby": describedBy,
      ...handlers
    } = field.controlProps;
    return (
      <fieldset
        id={groupId}
        role="radiogroup"
        className={["prava-field prava-radio-group", className]
          .filter(Boolean)
          .join(" ")}
        style={style}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        aria-required={required || undefined}
        aria-describedby={describedBy}
        data-choice=""
      >
        <legend className="prava-field__legend">
          {label}
          {required && (
            <span className="prava-label__required">{messages.required}</span>
          )}
        </legend>
        <div
          className="prava-radio-group__options"
          data-orientation={orientation}
        >
          {options.map((option, index) => (
            <Choice
              {...handlers}
              key={option.value}
              ref={controller && index > 0 ? undefined : ref}
              kind="radio"
              name={name ?? generatedName}
              value={option.value}
              label={option.label}
              disabled={option.disabled}
              required={required}
              checked={value === undefined ? undefined : value === option.value}
              defaultChecked={
                defaultValue === undefined
                  ? undefined
                  : defaultValue === option.value
              }
            />
          ))}
        </div>
        {field.messages}
      </fieldset>
    );
  },
);
