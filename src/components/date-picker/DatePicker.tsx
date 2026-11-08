import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ChangeEventHandler,
  FocusEvent,
  FocusEventHandler,
  FormEventHandler,
  InputHTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
} from "react";
import { placeFloating, usePresence } from "../../internal/overlay";
import {
  bindField,
  fillMessage,
  onPropertyWrite,
  setRef,
  useField,
  type FieldBinding,
  type FieldProps,
} from "../field/field";
import { usePravaConfig } from "../provider/PravaProvider";
import {
  Calendar,
  dateFormat,
  formatIso,
  isIsoDate,
  readDates,
  type DateRange,
} from "./Calendar";

type DatePickerBase = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | "children"
  | "defaultValue"
  | "form"
  | "max"
  | "min"
  | "name"
  | "onBlur"
  | "onChange"
  | "onInvalid"
  | "size"
  | "type"
  | "value"
> &
  Omit<FieldProps, "field"> & {
    /** Visible label above the control. */
    label?: ReactNode;
    /** Earliest allowed date, ISO `YYYY-MM-DD`. */
    min?: string;
    /** Latest allowed date, ISO `YYYY-MM-DD`. */
    max?: string;
    /** Return true for an ISO date that can't be chosen or typed. */
    isDateDisabled?: (date: string) => boolean;
    /** Form field name. Submits ISO `YYYY-MM-DD`; a range submits `start/end`. */
    name?: string;
    form?: string;
    required?: boolean;
    /** Connects react-hook-form: `field={register("due")}` or Controller's `field={field}`. */
    field?: FieldBinding;
    /** Change event from the form control underneath; react-hook-form uses this. */
    onChange?: ChangeEventHandler<HTMLInputElement>;
    onBlur?: FocusEventHandler<HTMLInputElement>;
    onInvalid?: FormEventHandler<HTMLInputElement>;
    /** Extra classes for inner slots; `className` goes on the field's well. */
    classNames?: {
      input?: string;
      button?: string;
      popup?: string;
      calendar?: string;
    };
  };

export type DatePickerProps = DatePickerBase &
  (
    | {
        /** `single` picks one date; `range` picks a start and an end. */
        mode?: "single";
        /** Chosen date as ISO `YYYY-MM-DD`; empty means none. Wins over `defaultValue`. */
        value?: string;
        /** Initial date when uncontrolled. */
        defaultValue?: string;
        /** Called with an allowed ISO date, or `""` when the field is cleared or holds an invalid entry. */
        onValueChange?: (value: string) => void;
      }
    | {
        /** `single` picks one date; `range` picks a start and an end. */
        mode: "range";
        /** Chosen range as ISO `[start, end]`; `["", ""]` means none. Wins over `defaultValue`. */
        value?: DateRange;
        /** Initial range when uncontrolled. */
        defaultValue?: DateRange;
        /** Called with allowed dates in order, or `["", ""]` when cleared or invalid. */
        onValueChange?: (value: [string, string]) => void;
      }
  );

// Text that wins over the formatted value, kept only while the value is still the one it was typed against.
type Draft = { text: string; against: string; problem?: string };

const toSerial = (value: unknown, range: boolean) => {
  const dates = readDates(value);
  return !dates ? "" : range ? dates.join("/") : dates[0];
};

/**
 * Reads typed dates in the locale's numeric order, in its digits or Latin ones. A group of four digits
 * first means ISO, whatever the locale. Returns null unless each date is real and has a four-digit year.
 */
export const parseTyped = (text: string, locale: string, count: number) => {
  const digits = Array.from(
    new Intl.NumberFormat(locale, { useGrouping: false }).format(9876543210),
  ).reverse();
  const groups = text
    .replace(/\p{Nd}/gu, (digit) => {
      const value = digits.indexOf(digit);
      return value < 0 ? digit : String(value);
    })
    .match(/\d+/g);
  if (groups?.length !== count * 3) return null;
  const order = numericFormat(locale)
    .formatToParts(0)
    .map((part) => part.type)
    .filter((type) => type === "year" || type === "month" || type === "day");
  const dates: string[] = [];
  for (let i = 0; i < groups.length; i += 3) {
    const date = groups.slice(i, i + 3);
    const at = (type: "year" | "month" | "day") =>
      date[
        date[0]!.length === 4
          ? ["year", "month", "day"].indexOf(type)
          : order.indexOf(type)
      ]!;
    const iso = `${at("year")}-${at("month").padStart(2, "0")}-${at("day").padStart(2, "0")}`;
    if (!isIsoDate(iso)) return null;
    dates.push(iso);
  }
  return dates;
};

const numericFormat = (locale: string) =>
  dateFormat(locale, { year: "numeric", month: "2-digit", day: "2-digit" });

/**
 * A typed date field with a calendar in a modal dialog, following the WAI-ARIA date picker dialog
 * pattern. Values are ISO `YYYY-MM-DD` strings, so no time zone can shift them. A hidden input is the
 * real form control, so forms, native validation and react-hook-form keep working.
 * @example
 * ```tsx
 * import { DatePicker } from 'prava-ui/date-picker';
 * <DatePicker label="Due date" min="2026-01-01" field={register('due')} error={errors.due?.message} />
 * ```
 */
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  function DatePicker(rawProps, forwardedRef) {
    const binding = rawProps.field;
    const {
      mode = "single",
      label,
      min,
      max,
      isDateDisabled,
      name,
      form,
      required,
      disabled,
      readOnly,
      placeholder,
      value,
      defaultValue,
      onValueChange,
      onChange,
      onBlur,
      onInvalid,
      onKeyDown,
      description,
      error,
      invalid,
      id,
      className,
      style,
      classNames,
      ref,
      ...inputProps
    } = bindField<HTMLInputElement, DatePickerProps>(
      // Controller reads event.target.value, which holds `start/end` for a range; it should store the pair.
      rawProps.mode === "range" && binding && "value" in binding
        ? {
            ...rawProps,
            field: {
              ...binding,
              onChange: (event) =>
                (
                  binding.onChange as unknown as
                    ((dates: string[]) => unknown) | undefined
                )?.(event.target.value.split("/")),
            },
          }
        : rawProps,
      forwardedRef,
    );
    const range = mode === "range";
    const { messages, locale } = usePravaConfig();

    const [inner, setInner] = useState(() => toSerial(defaultValue, range));
    const current = value !== undefined ? toSerial(value, range) : inner;
    const [draft, setDraft] = useState<Draft>();
    const liveDraft = draft?.against === current ? draft : undefined;
    const typedProblem = liveDraft?.problem;
    const [open, setOpen] = useState(false);

    const rootRef = useRef<HTMLDivElement>(null);
    const wellRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLInputElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDialogElement>(null);
    const controlRef = useRef<HTMLInputElement | null>(null);
    const initial = useRef(current);
    const revalidating = useRef(false);

    const field = useField<HTMLInputElement>({
      id,
      description,
      error: error ?? typedProblem,
      invalid,
      onBlur: (event) => {
        if (!revalidating.current) onBlur?.(event);
      },
      onChange,
      onInvalid,
      "aria-describedby": inputProps["aria-describedby"],
      "aria-invalid": inputProps["aria-invalid"],
    });
    const {
      id: textId,
      "aria-invalid": ariaInvalid,
      "aria-describedby": describedBy,
      ...handlers
    } = field.controlProps;

    const numeric = useMemo(() => numericFormat(locale), [locale]);
    const full = useMemo(
      () => dateFormat(locale, { dateStyle: "full" }),
      [locale],
    );
    const dates = readDates(current);
    const inWords = dates
      ?.slice(0, range ? 2 : 1)
      .map((iso) => formatIso(full, iso))
      .join(" – ");
    const show = (list: string[]) =>
      list.map((iso) => formatIso(numeric, iso)).join(" – ");

    const writing = useRef(false);
    const sync = useCallback(() => {
      const el = controlRef.current;
      if (el && !writing.current)
        setInner(toSerial(el.value, el.dataset.range !== undefined));
    }, []);

    // State is the source of truth; this mirrors it into the hidden input, which React leaves uncontrolled.
    useEffect(() => {
      const el = controlRef.current;
      if (!el || el.value === current) return;
      writing.current = true;
      el.value = current;
      writing.current = false;
    });
    // A value set from outside drops a rejected entry, its block on submitting, and any message it left.
    useEffect(() => {
      const el = controlRef.current;
      if (!el) return;
      const stale = el.validity.customError && !typedProblem;
      el.setCustomValidity(typedProblem ?? "");
      if (!stale) return;
      revalidating.current = true;
      el.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
      revalidating.current = false;
    }, [typedProblem]);

    const mergedControlRef = useCallback(
      (el: HTMLInputElement | null) => {
        if (el) {
          controlRef.current = el;
          onPropertyWrite(el, "value", sync);
          // defineProperty, not assignment: this must stay on the element and never reach HTMLElement.prototype.
          Object.defineProperty(el, "focus", {
            configurable: true,
            value: (focusOptions?: FocusOptions) =>
              textRef.current?.focus(focusOptions),
          });
        }
        setRef(ref, el);
      },
      [ref, sync],
    );

    // Native form.reset() fires no write we can observe; react-hook-form's reset also calls it first.
    useEffect(() => {
      const owner = controlRef.current?.form;
      if (!owner) return;
      const onReset = () => {
        setInner(initial.current);
        setDraft(undefined);
      };
      owner.addEventListener("reset", onReset);
      return () => owner.removeEventListener("reset", onReset);
    }, []);

    const commit = (next: string, problem?: string) => {
      const el = controlRef.current;
      if (!el) return;
      // Set now, not in the effect: the blur that follows validates this same tick.
      el.setCustomValidity(problem ?? "");
      if (next === current) return;
      // The prototype setter, so React's value tracker still sees a change and fires onChange.
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )!.set!.call(el, next);
      setInner(next);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      const emit = onValueChange as ((v: unknown) => void) | undefined;
      emit?.(range ? (next ? next.split("/") : ["", ""]) : next);
    };

    const problemWith = (iso: string) => {
      if (isIsoDate(min) && iso < min)
        return fillMessage(
          messages.rangeUnderflow,
          { min: formatIso(numeric, min) },
          locale,
        );
      if (isIsoDate(max) && iso > max)
        return fillMessage(
          messages.rangeOverflow,
          { max: formatIso(numeric, max) },
          locale,
        );
      return isDateDisabled?.(iso) ? messages.dateUnavailable : undefined;
    };

    const applyTyped = () => {
      if (!liveDraft || liveDraft.problem) return;
      const text = liveDraft.text.trim();
      if (!text) {
        setDraft(undefined);
        commit("");
        return;
      }
      const parsed = parseTyped(text, locale, range ? 2 : 1);
      const problem = parsed
        ? parsed.map(problemWith).find(Boolean)
        : messages.badInput;
      if (problem) {
        // Never emit a rejected date: the value empties and the text stays for correcting.
        setDraft({ text: liveDraft.text, against: "", problem });
        commit("", problem);
      } else {
        setDraft(undefined);
        commit(toSerial(parsed, range));
      }
    };

    useEffect(() => {
      const popup = popupRef.current;
      const well = wellRef.current;
      if (!popup || !well) return;
      if (!open) {
        if (popup.open) {
          popup.close();
          buttonRef.current?.focus();
        }
        return;
      }
      if (!popup.open) popup.showModal();
      const place = () => placeFloating(well, popup, "bottom", "start");
      place();
      popup
        .querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]')
        ?.focus();
      // Scrolling inside the popup doesn't move the field.
      const onScroll = (event: Event) => {
        if (!popup.contains(event.target as Node)) place();
      };
      window.addEventListener("resize", place);
      window.addEventListener("scroll", onScroll, true);
      return () => {
        window.removeEventListener("resize", place);
        window.removeEventListener("scroll", onScroll, true);
      };
    }, [open]);
    // Runs after the effect above, so the exit transition has started when presence reads it.
    const mounted = usePresence(open, popupRef);

    const onRootBlur = (event: FocusEvent<HTMLDivElement>) => {
      if (open || (event.target as Element) === controlRef.current) return;
      if (rootRef.current?.contains(event.relatedTarget as Node | null)) return;
      controlRef.current?.dispatchEvent(
        new FocusEvent("focusout", { bubbles: true }),
      );
    };

    const pick = (next: string) => {
      setDraft(undefined);
      commit(next);
      setOpen(false);
    };
    const calendarProps = range
      ? {
          mode: "range" as const,
          value: (dates ?? ["", ""]) as DateRange,
          onValueChange: (next: [string, string]) => pick(next.join("/")),
        }
      : { mode: "single" as const, value: current, onValueChange: pick };

    return (
      <span className="prava-field">
        {label != null && (
          <label className="prava-field__legend" htmlFor={textId}>
            {label}
            {required && (
              <span className="prava-label__required">{messages.required}</span>
            )}
          </label>
        )}
        <div
          ref={rootRef}
          className="prava-date-picker__root"
          onBlur={onRootBlur}
        >
          <div
            ref={wellRef}
            className={["prava-control prava-date-picker", className]
              .filter(Boolean)
              .join(" ")}
            style={style}
            data-open={open || undefined}
            data-invalid={ariaInvalid}
            data-disabled={disabled || undefined}
          >
            <input
              {...inputProps}
              ref={textRef}
              id={textId}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              disabled={disabled}
              readOnly={readOnly}
              className={["prava-date-picker__input", classNames?.input]
                .filter(Boolean)
                .join(" ")}
              placeholder={
                placeholder ??
                show(range ? ["2000-01-31", "2000-12-31"] : ["2000-12-31"])
              }
              aria-invalid={ariaInvalid}
              aria-describedby={describedBy}
              aria-required={required || inputProps["aria-required"]}
              value={
                liveDraft?.text ??
                (dates ? show(range ? dates : [dates[0]]) : "")
              }
              onChange={(event) =>
                setDraft({ text: event.target.value, against: current })
              }
              onBlur={applyTyped}
              onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                onKeyDown?.(event);
                // Not prevented: Enter still submits the form, now with the typed date in it.
                if (event.key === "Enter") applyTyped();
              }}
            />
            <button
              ref={buttonRef}
              type="button"
              disabled={disabled || readOnly}
              className={["prava-date-picker__button", classNames?.button]
                .filter(Boolean)
                .join(" ")}
              aria-label={
                inWords
                  ? fillMessage(messages.changeDate, { date: inWords }, locale)
                  : messages.chooseDate
              }
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls={`${textId}-calendar`}
              onClick={(event: MouseEvent<HTMLButtonElement>) => {
                // Safari doesn't focus a button on click, and focus returns here on close.
                event.currentTarget.focus();
                setOpen(true);
              }}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <rect x="2.5" y="3.5" width="11" height="10" rx="1.5" />
                <path d="M2.5 6.5h11M5.5 2v3M10.5 2v3" />
              </svg>
            </button>
          </div>
          <input
            {...handlers}
            ref={mergedControlRef}
            hidden
            type="text"
            tabIndex={-1}
            name={name}
            form={form}
            required={required}
            disabled={disabled}
            data-range={range || undefined}
            defaultValue={initial.current}
          />
          <dialog
            ref={popupRef}
            id={`${textId}-calendar`}
            aria-modal="true"
            aria-label={messages.chooseDate}
            className={[
              "prava-floating prava-date-picker__popup",
              classNames?.popup,
            ]
              .filter(Boolean)
              .join(" ")}
            data-open={open ? "" : undefined}
            onCancel={(event) => {
              event.preventDefault();
              setOpen(false);
            }}
            onClose={() => setOpen(false)}
            onKeyDown={(event) => {
              if (event.key !== "Escape") return;
              event.preventDefault();
              event.stopPropagation(); // Escape must not also close a surrounding dialog
              setOpen(false);
            }}
            // ::backdrop presses target the dialog itself; the calendar covers everything else.
            onClick={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            {mounted && (
              <Calendar
                {...calendarProps}
                min={min}
                max={max}
                isDateDisabled={isDateDisabled}
                className={classNames?.calendar}
              />
            )}
          </dialog>
        </div>
        {field.messages}
      </span>
    );
  },
);
