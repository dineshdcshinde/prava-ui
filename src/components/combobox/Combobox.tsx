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
  ReactElement,
  ReactNode,
  RefAttributes,
  SelectHTMLAttributes,
} from "react";
import { flushSync } from "react-dom";
import {
  bindField,
  fillMessage,
  onPropertyWrite,
  setRef,
  useField,
  type FieldBinding,
  type FieldProps,
} from "../field/field";
import {
  placeFloating,
  usePresence,
  useOutsidePress,
  type FloatingPlacement,
} from "../../internal/overlay";
import { usePravaConfig } from "../provider/PravaProvider";
import type { SelectOption, SelectOptionGroup } from "../select/Select";

// About three rows and a bit, so a shorter space opens beside the field instead.
const MIN_LIST_ROOM = 144;
// Long enough that each keystroke of a burst doesn't queue its own announcement.
const ANNOUNCE_DELAY = 400;

export type ComboboxOption = SelectOption;
export type ComboboxOptionGroup<T extends ComboboxOption = ComboboxOption> =
  SelectOptionGroup<T>;
type FormControl = HTMLInputElement | HTMLSelectElement;

type ComboboxBase<T extends ComboboxOption> = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  | "children"
  | "defaultValue"
  | "form"
  | "list"
  | "multiple"
  | "name"
  | "onBlur"
  | "onChange"
  | "onInvalid"
  | "size"
  | "type"
  | "value"
> &
  Omit<FieldProps, "field"> & {
    /** Options and `{ label, options }` groups, the same shape as Select. Pass the latest results when the server filters. */
    options: readonly (T | ComboboxOptionGroup<T>)[];
    /** Visible label above the control. */
    label?: ReactNode;
    size?: "sm" | "md" | "lg";
    /** Controlled text in the input. */
    inputValue?: string;
    /** Called with the text as it is typed, and when choosing or leaving the field replaces it. */
    onInputValueChange?: (text: string) => void;
    /** Filters options by label or `searchText` as people type. Set `false` when the server filters. */
    filter?: boolean;
    /** Marks results as loading: shows and announces the localized `loading` message. */
    loading?: boolean;
    /** Enter or leaving the field keeps typed text that matches no option as the value. */
    allowCustomValue?: boolean;
    name?: string;
    form?: string;
    required?: boolean;
    /** Extra classes for the inner slots. */
    classNames?: {
      input?: string;
      popup?: string;
      list?: string;
      option?: string;
      chip?: string;
    };
    /** Connects react-hook-form: `field={register("city")}` or Controller's `field={field}`. */
    field?: FieldBinding<HTMLInputElement>;
    /** Change event from the form control underneath; react-hook-form uses this. */
    onChange?: ChangeEventHandler<HTMLInputElement>;
    onBlur?: FocusEventHandler<HTMLInputElement>;
    onInvalid?: FormEventHandler<HTMLInputElement>;
  };

export type ComboboxProps<T extends ComboboxOption = ComboboxOption> =
  ComboboxBase<T> &
    (
      | {
          multiple?: false;
          value?: string;
          defaultValue?: string;
          /** `option` is undefined for a custom value, and when the value is cleared (`""`). */
          onValueChange?: (value: string, option: T | undefined) => void;
        }
      | {
          /** Choose several options; they show as removable chips and the value is an array. */
          multiple: true;
          value?: readonly string[];
          defaultValue?: readonly string[];
          /** `options` holds the known options, so custom values appear only in `values`. */
          onValueChange?: (values: string[], options: T[]) => void;
        }
    );

const toValues = (value: unknown): string[] =>
  value == null || value === ""
    ? []
    : Array.isArray(value)
      ? value.map(String)
      : [String(value as string)];
const isSelect = (el: FormControl): el is HTMLSelectElement =>
  el.tagName === "SELECT";
const readValues = (el: FormControl) =>
  isSelect(el)
    ? Array.from(el.options)
        .filter((o) => o.selected)
        .map((o) => o.value)
    : toValues(el.value);
const sameValues = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((value, i) => value === b[i]);
const isGroup = <T extends ComboboxOption>(
  entry: T | ComboboxOptionGroup<T>,
): entry is ComboboxOptionGroup<T> => !("value" in entry);
const textOf = (option: ComboboxOption) =>
  option.searchText ??
  (typeof option.label === "string" || typeof option.label === "number"
    ? String(option.label)
    : option.value);
const normalize = (text: string, locale: string) =>
  text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase(locale);
const flatten = <T extends ComboboxOption>(
  entries: readonly (T | ComboboxOptionGroup<T>)[],
) => entries.flatMap((e) => (isGroup(e) ? [...e.options] : [e]));
const join = (...names: (string | undefined)[]) =>
  names.filter(Boolean).join(" ");

function ComboboxImpl<T extends ComboboxOption>(
  rawProps: ComboboxProps<T>,
  forwardedRef: React.ForwardedRef<FormControl>,
) {
  const binding = rawProps.field;
  const {
    options,
    label,
    size = "md",
    multiple = false,
    filter = true,
    loading = false,
    allowCustomValue = false,
    inputValue,
    onInputValueChange,
    name,
    form,
    required,
    disabled,
    readOnly,
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
    classNames,
    style,
    ref,
    ...inputProps
  } = bindField<HTMLInputElement, ComboboxProps<T>>(
    // Controller reads event.target.value, which holds only the first choice of a multiple select.
    rawProps.multiple && binding && "value" in binding
      ? {
          ...rawProps,
          field: {
            ...binding,
            onChange: (event) =>
              (
                binding.onChange as unknown as
                  ((values: string[]) => unknown) | undefined
              )?.(readValues(event.target)),
          },
        }
      : rawProps,
    forwardedRef as React.ForwardedRef<HTMLInputElement>,
  );

  const { messages, locale } = usePravaConfig();
  const field = useField<HTMLInputElement>({
    id,
    description,
    error,
    invalid,
    onBlur,
    onChange,
    onInvalid,
    "aria-describedby": inputProps["aria-describedby"],
    "aria-invalid": inputProps["aria-invalid"],
  });
  const {
    id: inputId,
    "aria-invalid": ariaInvalid,
    "aria-describedby": describedBy,
    ...handlers
  } = field.controlProps;

  // Server results replace `options`, so chosen values must keep their labels after they leave the list.
  const [seen] = useState(() => new Map<string, T>());
  const [customs] = useState(() => new Set<string>());
  const flat = useMemo(() => {
    const all = flatten(options);
    for (const option of all) seen.set(option.value, option);
    return all;
  }, [options, seen]);
  const [inner, setInner] = useState(() => toValues(defaultValue));
  const selected = value !== undefined ? toValues(value) : inner;
  const [open, setOpen] = useState(false);
  // Text typed since the last choice; null means the input shows the current value.
  const [draft, setDraft] = useState<string | null>(null);
  const [active, setActive] = useState<string>();
  const [announced, setAnnounced] = useState("");

  const rootRef = useRef<HTMLDivElement>(null);
  const wellRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const controlRef = useRef<FormControl | null>(null);
  const initial = useRef(selected);
  const mounted = usePresence(open, popupRef);

  const textFor = (v: string | undefined) => {
    if (v === undefined) return "";
    const option = seen.get(v);
    return option ? textOf(option) : v;
  };
  const selectedText = multiple ? "" : textFor(selected[0]);
  const text = inputValue ?? draft ?? selectedText;

  const writing = useRef(false);
  const write = useCallback((el: FormControl, next: readonly string[]) => {
    writing.current = true;
    if (isSelect(el))
      for (const option of Array.from(el.options))
        option.selected = next.includes(option.value);
    else el.value = next[0] ?? "";
    writing.current = false;
  }, []);
  const sync = useCallback(() => {
    const el = controlRef.current;
    if (!el || writing.current) return;
    const next = readValues(el);
    setInner((prev) => (sameValues(prev, next) ? prev : next));
    setDraft(null);
  }, []);

  // A hidden native control is the real form control: names, native validation, and react-hook-form all read it.
  // A select can't hold a value missing from its options, so single mode uses an input for custom and server values.
  // shortcut: multiple with register() can only set values seen in `options`, use Controller when options load later.
  useEffect(() => {
    const el = controlRef.current;
    if (el && !sameValues(readValues(el), selected)) write(el, selected);
  });

  const mergedControlRef = useCallback(
    (el: FormControl | null) => {
      if (el) {
        controlRef.current = el;
        onPropertyWrite(el, "value", sync);
        // defineProperty, not assignment: this must stay on the element and never reach HTMLElement.prototype.
        Object.defineProperty(el, "focus", {
          configurable: true,
          value: (focusOptions?: FocusOptions) =>
            inputRef.current?.focus(focusOptions),
        });
      }
      setRef(ref as React.Ref<FormControl>, el);
    },
    [ref, sync],
  );
  const optionRef = useCallback(
    (el: HTMLOptionElement | null) => {
      if (el) onPropertyWrite(el, "selected", sync);
    },
    [sync],
  );

  const filtering = filter && draft !== null && text !== "";
  const visible = useMemo(() => {
    if (!filtering) return options;
    const needle = normalize(text, locale);
    const matches = (o: T) => normalize(textOf(o), locale).includes(needle);
    return options.flatMap<T | ComboboxOptionGroup<T>>((entry) => {
      if (!isGroup(entry)) return matches(entry) ? [entry] : [];
      const kept = entry.options.filter(matches);
      return kept.length ? [{ ...entry, options: kept }] : [];
    });
  }, [options, filtering, text, locale]);
  const rows = flatten(visible);
  const enabled = rows.filter((o) => !o.disabled);
  const listId = `${inputId}-list`;
  const optionId = (optionValue: string) =>
    `${inputId}-option-${rows.findIndex((o) => o.value === optionValue)}`;
  const activeId =
    open && enabled.some((o) => o.value === active)
      ? optionId(active as string)
      : undefined;

  const close = useCallback(() => setOpen(false), []);
  const openList = (nextActive?: string) => {
    if (disabled || readOnly) return;
    setOpen(true);
    setActive(nextActive);
  };

  const place = useCallback((hold = false) => {
    const popup = popupRef.current;
    const well = wellRef.current;
    const list = popup?.querySelector<HTMLElement>(".prava-combobox__list");
    if (!popup || !well || !list) return;
    const side = popup.dataset.side;
    // Results change with every keystroke; keep the side while typing so the list doesn't jump across the field.
    const keep = hold && (side === "top" || side === "bottom");
    // The list shrinks with the popup, so its real height comes from its content and its own limit.
    const limit = parseFloat(getComputedStyle(list).maxBlockSize) || Infinity;
    placeFloating(
      well,
      popup,
      keep ? (side as FloatingPlacement) : "bottom",
      "start",
      {
        gap: 4,
        contentHeight:
          popup.offsetHeight -
          list.offsetHeight +
          Math.min(list.scrollHeight, limit),
        minBlockRoom: MIN_LIST_ROOM,
        strict: keep,
      },
    );
  }, []);

  useEffect(() => {
    const popup = popupRef.current;
    if (!popup) return;
    if (!open) {
      if (popup.matches?.(":popover-open")) popup.hidePopover();
      return;
    }
    popup.showPopover?.(); // top layer: never clipped by a Card or scroll container
    // aria-labelledby on the input would name the list after its typed text; this covers label and FormField alike.
    const labelText = inputRef.current?.labels?.[0]?.textContent;
    if (labelText)
      popup
        .querySelector(".prava-combobox__list")
        ?.setAttribute("aria-label", labelText);
    const fit = () => {
      const well = wellRef.current;
      if (well)
        popup.style.inlineSize = `${well.getBoundingClientRect().width}px`;
      place();
    };
    fit();
    // Scrolling the list itself doesn't move the field.
    const onScroll = (event: Event) => {
      if (!popup.contains(event.target as Node)) place();
    };
    window.addEventListener("resize", fit);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, place]);
  useOutsidePress(open, rootRef, close);

  // The list changes height while filtering, loading, or wrapping chips.
  useEffect(() => {
    if (open) place(true);
  }, [open, visible, loading, selected.length, place]);

  useEffect(() => {
    if (activeId)
      document.getElementById(activeId)?.scrollIntoView?.({ block: "nearest" });
  }, [activeId]);

  const status = !open
    ? ""
    : loading
      ? messages.loading
      : rows.length === 1
        ? messages.oneResult
        : rows.length
          ? fillMessage(messages.resultCount, { count: rows.length }, locale)
        : messages.noResults;
  useEffect(() => {
    const timer = setTimeout(
      () => setAnnounced(status),
      status ? ANNOUNCE_DELAY : 0,
    );
    return () => clearTimeout(timer);
  }, [status]);

  // Native form.reset() fires no write we can observe; react-hook-form's reset also calls it first.
  useEffect(() => {
    const owner = controlRef.current?.form;
    if (!owner) return;
    const onReset = () => {
      setInner(initial.current);
      setDraft(null);
    };
    owner.addEventListener("reset", onReset);
    return () => owner.removeEventListener("reset", onReset);
  }, []);

  const commit = (next: string[]) => {
    const el = controlRef.current;
    if (!el || sameValues(selected, next)) return;
    if (isSelect(el)) {
      // A new custom value needs its <option> in the DOM before the change event reads it.
      flushSync(() => setInner(next));
      write(el, next);
    } else {
      // Past the instance accessor React tracks with; otherwise it treats the change event as a no-op.
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set?.call(el, next[0] ?? "");
      setInner(next);
    }
    el.dispatchEvent(new Event("change", { bubbles: true }));
    if (multiple)
      (onValueChange as ((v: string[], o: T[]) => void) | undefined)?.(
        next,
        next.flatMap((v) => seen.get(v) ?? []),
      );
    else
      (onValueChange as ((v: string, o: T | undefined) => void) | undefined)?.(
        next[0] ?? "",
        next[0] === undefined ? undefined : seen.get(next[0]),
      );
  };

  const showText = (next: string) => {
    setDraft(null);
    if (next !== text) onInputValueChange?.(next);
  };

  const choose = (option: T) => {
    if (option.disabled) return;
    if (multiple) {
      commit(
        selected.includes(option.value)
          ? selected.filter((v) => v !== option.value)
          : [...selected, option.value],
      );
      showText("");
      setActive(option.value);
    } else {
      commit([option.value]);
      showText(textOf(option));
      close();
    }
  };

  // Turns typed text into a value: an exact match, a custom value, or a cleared field. Anything else reverts.
  const settle = () => {
    if (draft === null) return;
    const typed = text.trim();
    const needle = normalize(typed, locale);
    const match = flat.find(
      (o) => !o.disabled && normalize(textOf(o), locale) === needle,
    );
    const accepted = !typed
      ? undefined
      : (match?.value ?? (allowCustomValue ? typed : undefined));
    if (accepted !== undefined) {
      if (!match) customs.add(accepted);
      commit(
        multiple
          ? selected.includes(accepted)
            ? selected
            : [...selected, accepted]
          : [accepted],
      );
      showText(multiple ? "" : textFor(accepted));
    } else {
      if (!typed && !multiple) commit([]);
      showText(typed ? selectedText : "");
    }
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(event);
    // During IME composition these keys belong to the candidate window. Safari reports only keyCode 229 on the closing Enter.
    if (
      event.defaultPrevented ||
      event.nativeEvent.isComposing ||
      event.keyCode === 229 ||
      readOnly
    )
      return;
    const count = enabled.length;
    const index = enabled.findIndex((o) => o.value === active);
    const go = (to: number) => setActive(enabled[to]?.value);
    const clamp = (to: number) => go(Math.max(0, Math.min(to, count - 1)));
    const keys: Record<string, (() => void) | undefined> = open
      ? {
          ArrowDown: () => {
            if (!event.altKey && count) go((index + 1) % count);
          },
          ArrowUp: () => {
            if (event.altKey) close();
            else go(index <= 0 ? count - 1 : index - 1);
          },
          PageDown: () => clamp(index + 10),
          PageUp: () => clamp(index - 10),
          Enter: () => {
            const option = enabled[index];
            if (option) {
              choose(option);
              return;
            }
            settle();
            close();
          },
          Escape: close,
        }
      : {
          ArrowDown: () =>
            openList(
              event.altKey
                ? undefined
                : (enabled.find((o) => selected.includes(o.value))?.value ??
                    enabled[0]?.value),
            ),
          ArrowUp: () => openList(enabled[count - 1]?.value),
          // A second Escape clears; with nothing to clear it stays free for a surrounding dialog.
          Escape: text
            ? () => {
                setDraft("");
                onInputValueChange?.("");
              }
            : undefined,
        };
    const action = keys[event.key];
    if (action) {
      event.preventDefault();
      event.stopPropagation(); // Escape must not also close a surrounding dialog
      action();
    } else if (event.key === "Enter") {
      settle(); // closed: the form submits with the settled value
    } else if (event.key === "Tab") {
      const option = enabled[index];
      if (open && option && !multiple) choose(option);
    } else if (event.key === "Backspace") {
      if (multiple && !text && selected.length) commit(selected.slice(0, -1));
    } else if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
      setActive(undefined); // these edit the text, so the list stops being the target
    }
  };

  const onRootBlur = (event: FocusEvent<HTMLDivElement>) => {
    if ((event.target as Element) === controlRef.current) return; // our own forwarded blur, below
    if (rootRef.current?.contains(event.relatedTarget as Node | null)) return;
    // Switching window or tab keeps focus here; don't throw away half-typed text.
    if (document.activeElement === inputRef.current) return;
    close();
    settle();
    controlRef.current?.dispatchEvent(
      new FocusEvent("focusout", { bubbles: true }),
    );
  };

  const onWellClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as Element;
    if (target.closest("button")) return;
    inputRef.current?.focus();
    if (!open) openList(enabled.find((o) => selected.includes(o.value))?.value);
    else if (target !== inputRef.current) close();
  };

  const row = (option: T) => {
    const isSelected = selected.includes(option.value);
    return (
      <div
        key={option.value}
        id={optionId(option.value)}
        role="option"
        className={join("prava-combobox__option", classNames?.option)}
        aria-selected={isSelected}
        aria-disabled={option.disabled || undefined}
        data-active={active === option.value || undefined}
        onClick={() => choose(option)}
      >
        {option.icon != null && (
          <span className="prava-combobox__icon" aria-hidden="true">
            {option.icon}
          </span>
        )}
        <span className="prava-combobox__text">
          <span>{option.label}</span>
          {option.description != null && (
            <span className="prava-combobox__description">
              {option.description}
            </span>
          )}
        </span>
        <svg
          className="prava-combobox__check"
          viewBox="0 0 16 16"
          aria-hidden="true"
        >
          <path d="M3.5 8.5l3 3 6-7" />
        </svg>
      </div>
    );
  };

  const countId = multiple && selected.length ? `${inputId}-count` : undefined;

  return (
    <span className="prava-field">
      {label != null && (
        <label className="prava-field__legend" htmlFor={inputId}>
          {label}
          {required && (
            <span className="prava-label__required">{messages.required}</span>
          )}
        </label>
      )}
      <div ref={rootRef} className="prava-combobox__root" onBlur={onRootBlur}>
        <div
          ref={wellRef}
          className={join("prava-control prava-combobox", className)}
          style={style}
          data-size={size}
          data-open={open || undefined}
          data-invalid={ariaInvalid}
          data-disabled={disabled || undefined}
          onClick={onWellClick}
        >
          {multiple &&
            selected.map((v) => {
              const option = seen.get(v);
              return (
                <span
                  className={join("prava-combobox__chip", classNames?.chip)}
                  key={v}
                >
                  {option?.icon != null && (
                    <span className="prava-combobox__icon" aria-hidden="true">
                      {option.icon}
                    </span>
                  )}
                  <span className="prava-combobox__chip-label">
                    {option?.label ?? v}
                  </span>
                  <button
                    type="button"
                    tabIndex={-1}
                    disabled={disabled || readOnly}
                    className="prava-combobox__chip-remove"
                    aria-label={fillMessage(
                      messages.removeOption,
                      { label: textFor(v) },
                      locale,
                    )}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => commit(selected.filter((s) => s !== v))}
                  >
                    <svg viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M4.5 4.5l7 7m0-7l-7 7" />
                    </svg>
                  </button>
                </span>
              );
            })}
          <input
            autoComplete="off"
            {...inputProps}
            ref={inputRef}
            id={inputId}
            type="text"
            role="combobox"
            disabled={disabled}
            readOnly={readOnly}
            className={join("prava-combobox__input", classNames?.input)}
            value={text}
            placeholder={
              multiple && selected.length ? undefined : inputProps.placeholder
            }
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={listId}
            aria-invalid={ariaInvalid}
            aria-describedby={join(describedBy, countId) || undefined}
            aria-required={required || inputProps["aria-required"]}
            aria-activedescendant={activeId}
            onKeyDown={onInputKeyDown}
            onChange={(event) => {
              setDraft(event.target.value);
              onInputValueChange?.(event.target.value);
              openList();
            }}
          />
          <svg
            className="prava-combobox__chevron"
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <path d="M4.5 6.25 8 9.75l3.5-3.5" />
          </svg>
        </div>
        {multiple ? (
          <select
            {...(handlers as unknown as SelectHTMLAttributes<HTMLSelectElement>)}
            ref={mergedControlRef}
            hidden
            tabIndex={-1}
            multiple
            name={name}
            form={form}
            required={required}
            disabled={disabled}
            defaultValue={[...selected]}
          >
            {[...new Set([...seen.keys(), ...customs, ...selected])].map(
              (v) => (
                <option key={v} ref={optionRef} value={v} />
              ),
            )}
          </select>
        ) : (
          <input
            {...handlers}
            ref={mergedControlRef}
            hidden
            tabIndex={-1}
            name={name}
            form={form}
            required={required}
            disabled={disabled}
            defaultValue={selected[0] ?? ""}
          />
        )}
        <div
          ref={popupRef}
          popover="manual"
          className={join(
            "prava-floating prava-combobox__popup",
            classNames?.popup,
          )}
          data-open={open || undefined}
          // Keeps focus in the input for rows, headings, and the scrollbar.
          onMouseDown={(event) => event.preventDefault()}
        >
          <div
            id={listId}
            role="listbox"
            className={join("prava-combobox__list", classNames?.list)}
            aria-label={inputProps["aria-label"]}
            aria-labelledby={inputProps["aria-labelledby"]}
            aria-multiselectable={multiple || undefined}
            aria-busy={loading || undefined}
          >
            {mounted &&
              visible.map((entry, i) =>
                isGroup(entry) ? (
                  <div
                    key={i}
                    role="group"
                    aria-labelledby={`${listId}-group-${i}`}
                  >
                    <div
                      id={`${listId}-group-${i}`}
                      className="prava-combobox__group-label"
                    >
                      {entry.label}
                    </div>
                    {entry.options.map(row)}
                  </div>
                ) : (
                  row(entry)
                ),
              )}
          </div>
          {/* Outside the listbox, which may only own options; the live region below announces these. */}
          {mounted && (loading || !rows.length) && (
            <div className="prava-combobox__status" aria-hidden="true">
              {loading ? messages.loading : messages.noResults}
            </div>
          )}
        </div>
        {/* Stays mounted outside the popup, or screen readers miss the first update. */}
        <div role="status" className="prava-combobox__sr-only">
          {announced}
        </div>
        {countId && (
          <span id={countId} className="prava-combobox__sr-only">
            {fillMessage(
              messages.selectedCount,
              { count: selected.length },
              locale,
            )}
          </span>
        )}
      </div>
      {field.messages}
    </span>
  );
}

/**
 * A text input with a filtered list: choose from options, keep custom text, or show server results.
 * Backed by a hidden native control so forms, native validation, and react-hook-form keep working.
 * @example
 * ```tsx
 * import { Combobox } from 'prava-ui/combobox';
 * <Combobox
 *   label={t('city')}
 *   placeholder={t('searchCities')}
 *   field={register('city')}
 *   error={errors.city?.message}
 *   options={[{ value: 'pune', label: t('pune') }, { value: 'delhi', label: t('delhi') }]}
 * />
 * ```
 */
export const Combobox = forwardRef(ComboboxImpl) as <
  T extends ComboboxOption = ComboboxOption,
>(
  props: ComboboxProps<T> & RefAttributes<HTMLInputElement | HTMLSelectElement>,
) => ReactElement | null;
