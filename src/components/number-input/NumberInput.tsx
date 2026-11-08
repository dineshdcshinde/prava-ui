import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import type {
  ChangeEvent,
  FocusEvent,
  KeyboardEvent,
  ReactNode,
  Ref,
} from "react";
import { bindField, onPropertyWrite, setRef } from "../field/field";
import { Input, type InputProps } from "../input";
import { usePravaConfig } from "../provider/PravaProvider";

export type NumberInputClassNames = {
  /** The text input. */
  input?: string;
  /** The group holding both buttons. */
  buttons?: string;
  /** Each button. */
  button?: string;
};

export type NumberInputProps = Omit<
  InputProps,
  | "size"
  | "type"
  | "value"
  | "defaultValue"
  | "min"
  | "max"
  | "step"
  | "endIcon"
> & {
  /** Current value when controlled; `null` is empty. */
  value?: number | null;
  /** Starting value when uncontrolled; `null` is empty. */
  defaultValue?: number | null;
  /** Called with the parsed number, or `null` when empty, as the user types and steps. */
  onValueChange?: (value: number | null) => void;
  /** Lowest value; typed values are clamped to it on blur or Enter. */
  min?: number;
  /** Highest value; typed values are clamped to it on blur or Enter. */
  max?: number;
  /** Amount the keys and buttons change the value by; defaults to 1, or 0.01 (1%) for `style: "percent"`. */
  step?: number;
  /** `Intl.NumberFormat` options for display and parsing, such as a currency. */
  formatOptions?: Intl.NumberFormatOptions;
  /** Control dimensions, matching Input. */
  size?: "sm" | "md" | "lg";
  /** Classes on the input and button slots; `className` and `style` go on the root. */
  classNames?: NumberInputClassNames;
  /** Optional visible label that floats above the value, as on Input. */
  label?: ReactNode;
};

const IGNORED = /[\s؜‎‏]/g;
const ARABIC = "٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹";
const NUMBER = /^[-+]?(\d+\.?\d*|\.\d+)$/;

/** Formats for a locale and parses the same text back: `undefined` is unparseable, `null` is empty. */
function numberTools(locale: string, options?: Intl.NumberFormatOptions) {
  const formatter = new Intl.NumberFormat(
    locale,
    // Precise by default; Intl would otherwise round the typed value to 3 places (0 for percent).
    options?.style === "currency"
      ? options
      : { maximumFractionDigits: 20, ...options },
  );
  const { numberingSystem } = formatter.resolvedOptions();
  const parts = new Intl.NumberFormat(locale, {
    numberingSystem,
    minimumFractionDigits: 1,
  }).formatToParts(-1234567.5);
  const part = (type: string) =>
    (parts.find((p) => p.type === type)?.value ?? "").replace(IGNORED, "");
  const group = part("group");
  const decimal = part("decimal");
  const minus = part("minusSign");
  const digits = [
    ...new Intl.NumberFormat(locale, {
      numberingSystem,
      useGrouping: false,
    }).format(9876543210),
  ].reverse();
  const allDigits = [...digits, ...ARABIC];
  const affixes = formatter
    .formatToParts(-1)
    .filter((p) =>
      ["currency", "unit", "percentSign", "literal"].includes(p.type),
    )
    .map((p) => p.value.replace(IGNORED, ""))
    .filter(Boolean);

  return {
    format: (value: number | null) =>
      value === null ? "" : formatter.format(value),
    parse: (text: string): number | null | undefined => {
      let s = text.replace(IGNORED, "");
      if (!s) return null;
      const accounting = /^\(.*\)$/.test(s);
      for (const affix of affixes) s = s.split(affix).join("");
      s = s.split(group).join("");
      if (/['’]/.test(group)) s = s.replace(/['’]/g, "");
      // Locales with their own separators (ar) still get "." and "," from a Latin keyboard.
      if (!/[.,]/.test(decimal)) s = s.replace(/,/g, "");
      s = s.split(decimal).join(".");
      // And Arabic keyboards still give ٫ and ٬ where the locale formats with Latin digits (plain "ar").
      s = s.replace(/٬/g, "").replace(/٫/g, ".");
      if (minus) s = s.split(minus).join("-");
      s = s.replace(/[−﹣－]/g, "-");
      s = Array.from(s, (ch) => {
        const index = allDigits.indexOf(ch);
        return index < 0 ? ch : String(index % 10);
      }).join("");
      if (!NUMBER.test(s)) return undefined;
      // Shifting the text, not dividing, keeps 1.1% exactly 0.011.
      const n = Number(options?.style === "percent" ? `${s}e-2` : s);
      if (!Number.isFinite(n)) return undefined;
      return (accounting ? -n : n) || 0; // "-0" is 0
    },
  };
}

const decimals = (n: number) => {
  const [mantissa = "", exponent = "0"] = String(n).split("e");
  return Math.max(0, (mantissa.split(".")[1]?.length ?? 0) - Number(exponent));
};
/** Adds in decimal, so 0.1 + 0.2 is 0.3. */
const add = (a: number, b: number) =>
  Number((a + b).toFixed(Math.min(100, Math.max(decimals(a), decimals(b)))));

/** Form libraries can hand over "", a string, or NaN; the component only ever holds a number or null. */
const toNumber = (value: unknown) => {
  if (value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const Icon = ({ plus }: { plus?: boolean }) => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path d={plus ? "M3.5 8h9M8 3.5v9" : "M3.5 8h9"} />
  </svg>
);

/**
 * A locale-aware number field with spinbutton semantics and step buttons; empty is `null`, not 0.
 * Connect react-hook-form with `field={register("qty")}` or Controller's `field={field}`: the form
 * receives a number or `null`, so don't spread `register` onto it. Forms submit the plain number, such as `1234.5`.
 * @example
 * ```tsx
 * import { NumberInput } from 'prava-ui/number-input';
 * <NumberInput label="Quantity" defaultValue={1} min={0} max={10} onValueChange={setQuantity} />
 * ```
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  function NumberInput(rawProps, forwardedRef) {
    const binding = rawProps.field;
    // The form hears numbers from emit and blur below; its ref goes to the hidden input, forwardedRef to the visible one.
    const {
      value: valueProp,
      defaultValue,
      onValueChange,
      min,
      max,
      step,
      formatOptions,
      size = "md",
      className,
      classNames,
      style,
      name,
      form,
      disabled,
      readOnly,
      onChange,
      onBlur,
      onKeyDown,
      ref: hiddenRef,
      ...inputProps
    } = bindField<HTMLInputElement, NumberInputProps>(
      {
        ...rawProps,
        field: binding && {
          ...binding,
          onChange: undefined,
          onBlur: undefined,
        },
      },
      null,
    );
    const { locale, messages } = usePravaConfig();
    const tools = useMemo(
      () => numberTools(locale, formatOptions),
      [locale, formatOptions],
    );
    const initial = useRef(toNumber(defaultValue ?? null));
    const [inner, setInner] = useState(initial.current);
    const value = valueProp === undefined ? inner : toNumber(valueProp);
    // What the user typed, kept until they commit. It only applies while the value is the one it produced.
    const [draft, setDraft] = useState<{
      text: string;
      value: number | null;
    } | null>(null);
    const typing = draft?.value === value ? draft : null;
    const visible = useRef<HTMLInputElement | null>(null);
    const hidden = useRef<HTMLInputElement | null>(null);

    const clamp = (n: number) =>
      Math.min(max ?? Infinity, Math.max(min ?? -Infinity, n));

    // No target.type: react-hook-form then takes target.value as is, rather than the hidden input's string.
    const formEvent = (type: string, next: number | null) =>
      ({
        type,
        target: { name: binding?.name, value: next },
      }) as unknown as ChangeEvent<HTMLInputElement> &
        FocusEvent<HTMLInputElement>;

    const emit = (next: number | null) => {
      if (next === value) return;
      setInner(next);
      onValueChange?.(next);
      binding?.onChange?.(formEvent("change", next));
    };

    /** Clamps what was typed and rounds it to what the format shows. Untouched values stay exact. */
    const commit = () => {
      if (!typing) return value;
      setDraft(null);
      if (value === null) return value;
      const next = clamp(tools.parse(tools.format(value)) ?? value);
      emit(next);
      return next;
    };

    // shortcut: stepping fires no native change, so a native validation message clears on the next blur, not at once.
    const stepBy = (direction: 1 | -1) => {
      if (disabled || readOnly) return;
      const amount = step ?? (formatOptions?.style === "percent" ? 0.01 : 1);
      const next =
        value === null
          ? clamp(direction > 0 ? (min ?? 0) : (max ?? 0))
          : clamp(add(value, amount * direction));
      setDraft(null);
      emit(next);
    };

    const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(event);
      if (
        event.defaultPrevented ||
        event.shiftKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.nativeEvent.isComposing
      )
        return;
      const limit = event.key === "Home" ? min : max;
      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        stepBy(event.key === "ArrowUp" ? 1 : -1);
      } else if (
        (event.key === "Home" || event.key === "End") &&
        limit !== undefined
      ) {
        // Without that limit, Home and End keep moving the caret.
        event.preventDefault();
        if (!readOnly) {
          setDraft(null);
          emit(limit);
        }
      } else if (event.key === "Enter") {
        commit(); // Runs before the browser's implicit submit, so the form gets the clamped value.
      }
    };

    // Native form.reset() fires no write we can observe; react-hook-form's reset also calls it first.
    useEffect(() => {
      const owner = hidden.current?.form;
      if (!owner) return;
      const onReset = () => {
        setInner(initial.current);
        setDraft(null);
      };
      owner.addEventListener("reset", onReset);
      return () => owner.removeEventListener("reset", onReset);
    }, []);

    const setHidden = (el: HTMLInputElement | null) => {
      hidden.current = el;
      if (el) {
        // react-hook-form's reset and setValue write here, and it focuses this element on an error.
        onPropertyWrite(el, "value", () => setInner(toNumber(el.value)));
        // defineProperty, not assignment: this must stay on the element and never reach HTMLElement.prototype.
        Object.defineProperty(el, "focus", {
          configurable: true,
          value: (options?: FocusOptions) => visible.current?.focus(options),
        });
      }
      setRef(hiddenRef as Ref<HTMLInputElement>, el);
    };

    const buttonClass = ["prava-number-input__button", classNames?.button]
      .filter(Boolean)
      .join(" ");
    const locked = disabled || readOnly;

    return (
      <span
        className={["prava-number-input", className].filter(Boolean).join(" ")}
        style={style}
        data-size={size}
      >
        <Input
          // iOS decimal keypads have no minus key, so negative numbers need the full keyboard.
          inputMode={min !== undefined && min >= 0 ? "decimal" : "text"}
          autoComplete="off"
          {...inputProps}
          ref={(el) => {
            visible.current = el;
            setRef(forwardedRef, el);
          }}
          role="spinbutton"
          aria-valuenow={value ?? undefined}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={value === null ? undefined : tools.format(value)}
          size={size}
          className={classNames?.input}
          form={form}
          disabled={disabled}
          readOnly={readOnly}
          value={typing ? typing.text : tools.format(value)}
          onChange={(event) => {
            const text = event.target.value;
            const parsed = tools.parse(text);
            // Unparseable text stays on screen and the value waits; never clamped mid-typing.
            const next = parsed === undefined ? value : parsed;
            setDraft({ text, value: next });
            emit(next);
            onChange?.(event);
          }}
          onBlur={(event) => {
            const next = commit();
            onBlur?.(event);
            binding?.onBlur?.(formEvent("blur", next));
          }}
          onKeyDown={handleKeyDown}
        />
        {/* APG spinbutton: focus stays in the text field and arrow keys do this job, so the buttons are not tab stops. */}
        <span
          className={["prava-number-input__buttons", classNames?.buttons]
            .filter(Boolean)
            .join(" ")}
        >
          <button
            type="button"
            tabIndex={-1}
            className={buttonClass}
            aria-label={messages.decrement}
            disabled={
              locked || (value !== null && min !== undefined && value <= min)
            }
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => stepBy(-1)}
          >
            <Icon />
          </button>
          <button
            type="button"
            tabIndex={-1}
            className={buttonClass}
            aria-label={messages.increment}
            disabled={
              locked || (value !== null && max !== undefined && value >= max)
            }
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => stepBy(1)}
          >
            <Icon plus />
          </button>
        </span>
        {/* The real form value: plain digits in every locale. Its attribute is its value, so React's defaultValue mirrors state. */}
        <input
          type="hidden"
          ref={setHidden}
          name={name}
          form={form}
          disabled={disabled}
          defaultValue={value === null ? "" : String(value)}
        />
      </span>
    );
  },
);
