import {
  createContext,
  forwardRef,
  useContext,
  useId,
  useRef,
  useState,
} from "react";
import type {
  AriaAttributes,
  ChangeEvent,
  FocusEvent,
  ForwardedRef,
  FormEvent,
  InputHTMLAttributes,
  MutableRefObject,
  ReactNode,
  Ref,
} from "react";
import {
  usePravaConfig,
  type BuiltInMessages,
} from "../provider/PravaProvider";

export type FieldControl =
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/**
 * A form library's connection to a control, typed by shape so Prava has no form-library dependency.
 * Matches both react-hook-form's `register()` result and `Controller`'s `field`.
 */
export type FieldBinding<E extends FieldControl = HTMLInputElement> = {
  name?: string;
  value?: unknown;
  disabled?: boolean;
  onChange?: (event: ChangeEvent<E>) => unknown;
  onBlur?: (event: FocusEvent<E>) => unknown;
  ref?: Ref<E>;
};

/** Props every Prava form control shares. */
export type FieldProps<E extends FieldControl = HTMLInputElement> = {
  /**
   * Connects the control to a form library: `field={register("email")}`, or `field={field}` inside
   * react-hook-form's `Controller`. The control's own props win, and its `onChange`/`onBlur` still run.
   */
  field?: FieldBinding<E>;
  /** Help text shown below the control and linked with `aria-describedby`. */
  description?: ReactNode;
  /**
   * Error message shown below the control; marks it invalid and replaces built-in validation text.
   * Pass `errors.name?.message` from react-hook-form, or `true` to mark invalid without text.
   */
  error?: ReactNode;
  /** Marks the control invalid without a message. */
  invalid?: boolean;
};

// Inside FormField, the field renders messages; nested controls only report.
export const FieldContext = createContext(false);

export const isMessage = (node: ReactNode) =>
  node != null && node !== false && node !== true && node !== "";

export const setRef = <T,>(ref: Ref<T> | undefined, value: T | null) => {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as MutableRefObject<T | null>).current = value;
};

/** Merges a `field` binding into a control's props and ref. Choice controls map its value to `checked`. */
export function bindField<
  E extends FieldControl,
  P extends {
    field?: FieldBinding<E>;
    onChange?: (event: ChangeEvent<E>) => void;
    onBlur?: (event: FocusEvent<E>) => void;
  },
>(
  { field, ...props }: P,
  forwardedRef: ForwardedRef<E>,
  valueProp: "value" | "checked" = "value",
) {
  type Bound = Omit<P, "field"> & { ref: Ref<E> };
  if (!field) return { ...props, ref: forwardedRef } as unknown as Bound;
  const { ref, onChange, onBlur, value, ...rest } = field;
  return {
    ...rest,
    // register() has no value key and leaves the control uncontrolled; Controller's value drives it.
    ...("value" in field && {
      [valueProp]: valueProp === "checked" ? Boolean(value) : value,
    }),
    ...props,
    onChange: (event: ChangeEvent<E>) => {
      props.onChange?.(event);
      onChange?.(event);
    },
    onBlur: (event: FocusEvent<E>) => {
      props.onBlur?.(event);
      onBlur?.(event);
    },
    ref: (el: E | null) => {
      setRef(ref, el);
      setRef(forwardedRef, el);
    },
  } as unknown as Bound;
}

/** Replaces `{name}` placeholders in a message; numbers are formatted for the locale. */
export const fillMessage = (
  template: string,
  params: Record<string, string | number>,
  locale: string,
) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return typeof value === "number"
      ? new Intl.NumberFormat(locale).format(value)
      : String(value);
  });

const watched = new WeakSet<object>();

/**
 * Calls `onWrite` after code assigns a DOM property directly, which fires no event; react-hook-form's
 * `reset` and `setValue` do this. React tracks input values with the same instance-level accessor.
 */
export function onPropertyWrite<E extends object>(
  el: E,
  prop: keyof E & string,
  onWrite: () => void,
) {
  if (watched.has(el)) return;
  watched.add(el);
  let owner: object | null = el;
  let descriptor: PropertyDescriptor | undefined;
  while (owner && !descriptor) {
    descriptor = Object.getOwnPropertyDescriptor(owner, prop);
    owner = Object.getPrototypeOf(owner) as object | null;
  }
  const { get, set } = descriptor ?? {};
  if (!get || !set) return;
  Object.defineProperty(el, prop, {
    configurable: true,
    get() {
      return get.call(this) as unknown;
    },
    set(value: unknown) {
      set.call(this, value);
      onWrite();
    },
  });
}

/** Maps a failed native constraint to the provider's localized message. */
export function validationMessage(
  el: FieldControl,
  messages: BuiltInMessages,
  locale: string,
) {
  const v = el.validity;
  if (v.valid) return undefined;
  const fill = (template: string) =>
    fillMessage(
      template,
      new Proxy(
        {},
        {
          get: (_, key: string) => {
            const value = String(
              (el as unknown as Record<string, unknown>)[key],
            );
            return value !== "" && Number.isFinite(Number(value))
              ? Number(value)
              : value;
          },
        },
      ),
      locale,
    );
  if (v.valueMissing)
    return el.tagName === "SELECT" ||
      el.type === "checkbox" ||
      el.type === "radio"
      ? messages.valueMissingChoice
      : messages.valueMissing;
  if (v.typeMismatch)
    return el.type === "url"
      ? messages.typeMismatchUrl
      : messages.typeMismatchEmail;
  if (v.badInput) return messages.badInput;
  if (v.patternMismatch) return el.title || messages.patternMismatch;
  if (v.tooShort) return fill(messages.tooShort);
  if (v.tooLong) return fill(messages.tooLong);
  if (v.rangeUnderflow) return fill(messages.rangeUnderflow);
  if (v.rangeOverflow) return fill(messages.rangeOverflow);
  if (v.stepMismatch) return messages.stepMismatch;
  return el.validationMessage; // setCustomValidity text, already the consumer's words
}

type UseFieldOptions<E extends FieldControl> = Omit<FieldProps<E>, "field"> & {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: AriaAttributes["aria-invalid"];
  onBlur?: (event: FocusEvent<E>) => void;
  onChange?: (event: ChangeEvent<E>) => void;
  onInvalid?: (event: FormEvent<E>) => void;
};

/**
 * Shared ids, ARIA, messages, and localized native validation for every form control.
 * Native messages appear after the user edits and leaves the control, or on submit, and clear
 * as soon as the value is valid. `<form noValidate>` hands validation to the app (for example react-hook-form).
 */
export function useField<E extends FieldControl>({
  id,
  description,
  error,
  invalid,
  onBlur,
  onChange,
  onInvalid,
  ...aria
}: UseFieldOptions<E>) {
  const nested = useContext(FieldContext);
  const { messages, locale } = usePravaConfig();
  const generatedId = useId();
  const [nativeError, setNativeError] = useState<string>();
  const dirty = useRef(false);
  const fieldId = id ?? generatedId;
  const message = isMessage(error) ? error : nativeError;
  const descriptionId = isMessage(description)
    ? `${fieldId}-description`
    : undefined;
  const errorId = isMessage(message) ? `${fieldId}-error` : undefined;
  const isInvalid =
    invalid ||
    error === true ||
    Boolean(errorId) ||
    aria["aria-invalid"] === true ||
    aria["aria-invalid"] === "true";

  const check = (el: E, force = false) => {
    if (nested || (!force && el.form?.noValidate)) return;
    setNativeError(validationMessage(el, messages, locale));
  };

  return {
    id: fieldId,
    controlProps: {
      id: fieldId,
      "aria-invalid": isInvalid || undefined,
      "aria-describedby":
        [aria["aria-describedby"], descriptionId, errorId]
          .filter(Boolean)
          .join(" ") || undefined,
      onBlur: (event: FocusEvent<E>) => {
        onBlur?.(event);
        if (dirty.current || nativeError) check(event.currentTarget);
      },
      onChange: (event: ChangeEvent<E>) => {
        onChange?.(event);
        dirty.current = true;
        if (nativeError) check(event.currentTarget);
      },
      onInvalid: (event: FormEvent<E>) => {
        onInvalid?.(event);
        if (event.defaultPrevented || nested) return;
        // Replace the browser bubble with the localized message below the control.
        event.preventDefault();
        const el = event.currentTarget;
        check(el, true);
        const first = Array.from(el.form?.elements ?? []).find(
          (c) =>
            (c as FieldControl).willValidate &&
            !(c as FieldControl).validity.valid,
        );
        if (first === el) el.focus();
      },
    },
    messages: (
      <>
        {descriptionId && (
          <div id={descriptionId} className="prava-field__description">
            {description}
          </div>
        )}
        {errorId && (
          <div id={errorId} className="prava-field__error">
            <svg viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="8" r="6.5" />
              <path d="M8 4.75v3.5M8 11h.01" />
            </svg>
            <span>{message}</span>
          </div>
        )}
      </>
    ),
  };
}

export type ChoiceProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  kind: "checkbox" | "radio" | "switch";
  label?: ReactNode;
};

/** The shared native input + painted indicator behind Checkbox, Switch, and RadioGroup options. */
export const Choice = forwardRef<HTMLInputElement, ChoiceProps>(function Choice(
  { kind, label, className, style, ...input },
  ref,
) {
  return (
    <label
      className={["prava-choice", `prava-${kind}`, className]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      <span className="prava-choice__control">
        <input
          {...input}
          ref={ref}
          type={kind === "radio" ? "radio" : "checkbox"}
          role={kind === "switch" ? "switch" : undefined}
          className="prava-choice__input"
        />
        <span className="prava-choice__indicator" aria-hidden="true">
          {kind === "checkbox" && (
            <svg viewBox="0 0 16 16">
              <path className="prava-choice__check" d="M3.5 8.5l3 3 6-7" />
              <path className="prava-choice__dash" d="M4 8h8" />
            </svg>
          )}
        </span>
      </span>
      {label != null && <span className="prava-choice__label">{label}</span>}
    </label>
  );
});
