import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ButtonHTMLAttributes,
  ChangeEventHandler,
  CSSProperties,
  FocusEvent,
  FocusEventHandler,
  FormEventHandler,
  KeyboardEvent,
  ReactElement,
  ReactNode,
  RefAttributes,
} from "react";
import {
  bindField,
  fillMessage,
  onPropertyWrite,
  setRef,
  useField,
  type FieldBinding,
  type FieldProps,
} from "../field/field";
import { placeFloating } from "../../internal/overlay";
import { usePravaConfig } from "../provider/PravaProvider";

// About three rows and a bit, so a shorter space opens beside the field instead.
const MIN_LIST_ROOM = 144;

export type SelectOption = {
  /** Stable value the form submits. Keep it the same in every language. */
  value: string;
  /** What people see; pass translated text or a node such as `<Trans>`. */
  label: ReactNode;
  /** Text for search and type-ahead when `label` is not a plain string. */
  searchText?: string;
  icon?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
};

export type SelectOptionGroup<T extends SelectOption = SelectOption> = {
  /** Group heading; pass translated text or a node. */
  label: ReactNode;
  options: readonly T[];
};

type SelectBase<T extends SelectOption> = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | "children"
  | "defaultValue"
  | "form"
  | "name"
  | "onBlur"
  | "onChange"
  | "onInvalid"
  | "type"
  | "value"
> &
  Omit<FieldProps<HTMLSelectElement>, "field"> & {
    /** Options and `{ label, options }` groups. Extra fields on an option are kept and typed. */
    options: readonly (T | SelectOptionGroup<T>)[];
    /** Visible label above the control. */
    label?: ReactNode;
    /** Shown until a choice is made. */
    placeholder?: ReactNode;
    size?: "sm" | "md" | "lg";
    /**
     * Where the list opens. `auto` picks from the space available. Another side is kept while it
     * leaves about three rows of room (or fits, beside the field); otherwise `auto` takes over.
     */
    placement?: "auto" | "top" | "bottom" | "start" | "end";
    name?: string;
    form?: string;
    required?: boolean;
    /** Adds a search box that filters the options by label or `searchText`. */
    searchable?: boolean;
    /** Replaces the label and description of each row; use it to draw your extra fields. */
    renderOption?: (option: T, state: { selected: boolean }) => ReactNode;
    /** Connects react-hook-form: `field={register("role")}` or Controller's `field={field}`. */
    field?: FieldBinding<HTMLSelectElement>;
    /** Change event from the form control underneath; react-hook-form uses this. */
    onChange?: ChangeEventHandler<HTMLSelectElement>;
    onBlur?: FocusEventHandler<HTMLSelectElement>;
    onInvalid?: FormEventHandler<HTMLSelectElement>;
  };

export type SelectProps<T extends SelectOption = SelectOption> = SelectBase<T> &
  (
    | {
        multiple?: false;
        value?: string;
        defaultValue?: string;
        onValueChange?: (value: string, option: T) => void;
      }
    | {
        /** Choose several options; they show as removable chips and the value is an array. */
        multiple: true;
        value?: readonly string[];
        defaultValue?: readonly string[];
        onValueChange?: (values: string[], options: T[]) => void;
      }
  );

const toValues = (value: unknown): string[] =>
  value == null || value === ""
    ? []
    : Array.isArray(value)
      ? value.map(String)
      : [String(value as string)];
const selectedValues = (el: HTMLSelectElement) =>
  Array.from(el.options)
    .filter((o) => o.selected && o.value)
    .map((o) => o.value);
const sameValues = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((value, i) => value === b[i]);
const isGroup = <T extends SelectOption>(
  entry: T | SelectOptionGroup<T>,
): entry is SelectOptionGroup<T> => !("value" in entry);
const textOf = (option: SelectOption) =>
  option.searchText ??
  (typeof option.label === "string" || typeof option.label === "number"
    ? String(option.label)
    : option.value);
const normalize = (text: string, locale: string) =>
  text.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase(locale);

const Check = () => (
  <svg className="prava-select__check" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3.5 8.5l3 3 6-7" />
  </svg>
);

function SelectImpl<T extends SelectOption>(
  rawProps: SelectProps<T>,
  forwardedRef: React.ForwardedRef<HTMLSelectElement>,
) {
  const binding = rawProps.field;
  const {
    options,
    label,
    placeholder,
    size = "md",
    placement = "auto",
    multiple = false,
    searchable = false,
    renderOption,
    name,
    form,
    required,
    disabled,
    value,
    defaultValue,
    onValueChange,
    onChange,
    onBlur,
    onInvalid,
    description,
    error,
    invalid,
    id,
    className,
    style,
    ref,
    ...triggerProps
  } = bindField<HTMLSelectElement, SelectProps<T>>(
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
              )?.(selectedValues(event.target)),
          },
        }
      : rawProps,
    forwardedRef,
  );

  const { messages, locale } = usePravaConfig();
  const field = useField<HTMLSelectElement>({
    id,
    description,
    error,
    invalid,
    onBlur,
    onChange,
    onInvalid,
    "aria-describedby": triggerProps["aria-describedby"],
    "aria-invalid": triggerProps["aria-invalid"],
  });
  const {
    id: triggerId,
    "aria-invalid": ariaInvalid,
    "aria-describedby": describedBy,
    ...handlers
  } = field.controlProps;

  const flat = useMemo(
    () => options.flatMap((e) => (isGroup(e) ? [...e.options] : [e])),
    [options],
  );
  const [inner, setInner] = useState(() => toValues(defaultValue));
  const selected = value !== undefined ? toValues(value) : inner;
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>();

  const rootRef = useRef<HTMLDivElement>(null);
  const wellRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement | null>(null);
  const typeahead = useRef({ text: "", at: 0 });
  const initial = useRef(selected);

  const writing = useRef(false);
  const sync = useCallback(() => {
    const el = selectRef.current;
    if (!el || writing.current) return;
    const next = selectedValues(el);
    setInner((prev) => (sameValues(prev, next) ? prev : next));
  }, []);

  // A hidden native select is the real form control: names, native validation, and react-hook-form all read it.
  // State is the source of truth; this mirrors it into the select, which React leaves uncontrolled.
  useEffect(() => {
    const el = selectRef.current;
    if (!el) return;
    const current = selectedValues(el);
    if (sameValues(current, selected)) return;
    writing.current = true;
    if (multiple)
      for (const option of Array.from(el.options))
        option.selected = selected.includes(option.value);
    else el.value = selected[0] ?? "";
    writing.current = false;
  });

  const mergedSelectRef = useCallback(
    (el: HTMLSelectElement | null) => {
      if (el) {
        selectRef.current = el;
        onPropertyWrite(el, "value", sync);
        // defineProperty, not assignment: this must stay on the element and never reach HTMLElement.prototype.
        Object.defineProperty(el, "focus", {
          configurable: true,
          value: (focusOptions?: FocusOptions) =>
            triggerRef.current?.focus(focusOptions),
        });
      }
      setRef(ref, el);
    },
    [ref, sync],
  );
  const optionRef = useCallback(
    (el: HTMLOptionElement | null) => {
      if (el) onPropertyWrite(el, "selected", sync);
    },
    [sync],
  );

  const visible = useMemo(() => {
    if (!searchable || !query) return options;
    const needle = normalize(query, locale);
    const matches = (o: T) => normalize(textOf(o), locale).includes(needle);
    return options.flatMap<T | SelectOptionGroup<T>>((entry) => {
      if (!isGroup(entry)) return matches(entry) ? [entry] : [];
      const kept = entry.options.filter(matches);
      return kept.length ? [{ ...entry, options: kept }] : [];
    });
  }, [options, query, searchable, locale]);
  const enabled = visible
    .flatMap((e) => (isGroup(e) ? [...e.options] : [e]))
    .filter((o) => !o.disabled);
  const optionId = (optionValue: string) =>
    `${triggerId}-option-${flat.findIndex((o) => o.value === optionValue)}`;

  // Long options widen the popup past the field. Holding that as a minimum stops filtering from shrinking it.
  const fitWidth = useCallback(() => {
    const popup = popupRef.current;
    const well = wellRef.current;
    if (!popup || !well) return;
    popup.style.minInlineSize = `${well.getBoundingClientRect().width}px`;
    popup.style.minInlineSize = getComputedStyle(popup).inlineSize;
  }, []);

  const place = useCallback(() => {
    const popup = popupRef.current;
    const well = wellRef.current;
    const list = popup?.querySelector<HTMLElement>(".prava-select__list");
    if (!popup || !well || !list) return;
    // The list shrinks with the popup, so its real height comes from its content and its own limit.
    const limit = parseFloat(getComputedStyle(list).maxBlockSize) || Infinity;
    placeFloating(
      well,
      popup,
      placement === "auto" ? "bottom" : placement,
      "start",
      {
        gap: 4,
        contentHeight:
          popup.offsetHeight -
          list.offsetHeight +
          Math.min(list.scrollHeight, limit),
        minBlockRoom: MIN_LIST_ROOM,
        strict: placement !== "auto",
      },
    );
  }, [placement]);

  const close = useCallback((refocus = false) => {
    setOpen(false);
    setQuery("");
    if (refocus) triggerRef.current?.focus();
  }, []);

  const openList = () => {
    if (disabled) return;
    // Safari doesn't focus a button on click, and keyboard handling lives on the trigger.
    triggerRef.current?.focus();
    setEverOpened(true);
    setOpen(true);
    setActive(
      enabled.find((o) => selected.includes(o.value))?.value ??
        enabled[0]?.value,
    );
  };

  useEffect(() => {
    const popup = popupRef.current;
    if (!popup) return;
    if (!open) {
      if (popup.matches?.(":popover-open")) popup.hidePopover();
      return;
    }
    popup.showPopover?.(); // top layer: never clipped by a Card or scroll container
    fitWidth();
    place();
    if (searchable) searchRef.current?.focus();
    const outside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    const onResize = () => {
      fitWidth();
      place();
    };
    // Scrolling the list itself doesn't move the field.
    const onScroll = (event: Event) => {
      if (!popup.contains(event.target as Node)) place();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    document.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open, searchable, fitWidth, place, close]);

  // The list can change height while filtering or wrapping.
  useEffect(() => {
    if (open) place();
  }, [open, visible, selected.length, place]);

  useEffect(() => {
    if (!open || active === undefined) return;
    document
      .getElementById(optionId(active))
      ?.scrollIntoView?.({ block: "nearest" });
  }, [open, active]);

  // Native form.reset() fires no write we can observe; react-hook-form's reset also calls it first.
  useEffect(() => {
    const owner = selectRef.current?.form;
    if (!owner) return;
    const onReset = () => setInner(initial.current);
    owner.addEventListener("reset", onReset);
    return () => owner.removeEventListener("reset", onReset);
  }, []);

  const commit = (next: string[]) => {
    const el = selectRef.current;
    if (!el) return;
    if (multiple)
      for (const option of Array.from(el.options))
        option.selected = next.includes(option.value);
    else el.value = next[0] ?? "";
    setInner(next);
    el.dispatchEvent(new Event("change", { bubbles: true }));
    const chosen = next.flatMap((v) => flat.filter((o) => o.value === v));
    if (multiple)
      (onValueChange as ((v: string[], o: T[]) => void) | undefined)?.(
        next,
        chosen,
      );
    else if (chosen[0])
      (onValueChange as ((v: string, o: T) => void) | undefined)?.(
        next[0]!,
        chosen[0],
      );
  };

  const choose = (option: T) => {
    if (option.disabled) return;
    if (!multiple) {
      commit([option.value]);
      close(true);
      return;
    }
    commit(
      selected.includes(option.value)
        ? selected.filter((v) => v !== option.value)
        : [...selected, option.value],
    );
    setActive(option.value);
  };

  const move = (to: number) => {
    const target = enabled[Math.max(0, Math.min(to, enabled.length - 1))];
    if (target) setActive(target.value);
  };

  const typeAhead = (key: string) => {
    const now = Date.now();
    const state = typeahead.current;
    state.text = now - state.at > 500 ? key : state.text + key;
    state.at = now;
    const needle = normalize(state.text, locale);
    const match = enabled.find((o) =>
      normalize(textOf(o), locale).startsWith(needle),
    );
    if (match) setActive(match.value);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const inSearch = event.target === searchRef.current;
    const printable =
      event.key.length === 1 &&
      event.key !== " " &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openList();
      } else if (printable) {
        openList();
        typeAhead(event.key);
      } else if (event.key === "Backspace" && multiple && selected.length) {
        commit(selected.slice(0, -1));
      }
      return;
    }
    const index = enabled.findIndex((o) => o.value === active);
    const keys: Record<string, () => void> = {
      ArrowDown: () => move(index + 1),
      ArrowUp: () => move(index - 1),
      PageDown: () => move(index + 10),
      PageUp: () => move(index - 10),
      Enter: () => {
        const option = enabled[index];
        if (option) choose(option);
      },
      Escape: () => close(true),
      ...(!inSearch && {
        Home: () => move(0),
        End: () => move(enabled.length - 1),
        " ": () => {
          const option = enabled[index];
          if (option) choose(option);
        },
      }),
    };
    const action = keys[event.key];
    if (action) {
      event.preventDefault();
      event.stopPropagation(); // Escape must not also close a surrounding dialog
      action();
    } else if (event.key === "Tab") {
      close();
    } else if (printable && !inSearch) {
      typeAhead(event.key);
    }
  };

  const onRootBlur = (event: FocusEvent<HTMLDivElement>) => {
    if ((event.target as Element) === selectRef.current) return; // our own forwarded blur, below
    if (rootRef.current?.contains(event.relatedTarget as Node | null)) return;
    close();
    selectRef.current?.dispatchEvent(
      new FocusEvent("focusout", { bubbles: true }),
    );
  };

  const selectedOptions = selected.flatMap((v) =>
    flat.filter((o) => o.value === v),
  );
  const single = multiple ? undefined : selectedOptions[0];
  const listId = `${triggerId}-list`;

  const row = (option: T) => {
    const isSelected = selected.includes(option.value);
    return (
      <div
        key={option.value}
        id={optionId(option.value)}
        role="option"
        className="prava-select__option"
        aria-selected={isSelected}
        aria-disabled={option.disabled || undefined}
        data-active={active === option.value || undefined}
        onMouseDown={(event) => event.preventDefault()}
        onMouseMove={() => {
          if (!option.disabled && active !== option.value)
            setActive(option.value);
        }}
        onClick={() => choose(option)}
      >
        {option.icon != null && (
          <span className="prava-select__icon" aria-hidden="true">
            {option.icon}
          </span>
        )}
        <span className="prava-select__text">
          {renderOption ? (
            renderOption(option, { selected: isSelected })
          ) : (
            <>
              <span>{option.label}</span>
              {option.description != null && (
                <span className="prava-select__description">
                  {option.description}
                </span>
              )}
            </>
          )}
        </span>
        <Check />
      </div>
    );
  };

  return (
    <span className="prava-field">
      {label != null && (
        <label className="prava-field__legend" htmlFor={triggerId}>
          {label}
          {required && (
            <span className="prava-label__required">{messages.required}</span>
          )}
        </label>
      )}
      <div
        ref={rootRef}
        className="prava-select__root"
        onBlur={onRootBlur}
        onKeyDown={onKeyDown}
        onKeyUp={(event) => {
          // Stops the button's Space click from toggling the list after keydown handled it.
          if (event.key === " " && event.target === triggerRef.current)
            event.preventDefault();
        }}
      >
        <div
          ref={wellRef}
          className={["prava-control prava-select", className]
            .filter(Boolean)
            .join(" ")}
          style={style as CSSProperties}
          data-size={size}
          data-open={open || undefined}
          data-invalid={ariaInvalid}
          data-disabled={disabled || undefined}
          onClick={(event) => {
            if (event.target === event.currentTarget)
              triggerRef.current?.click();
          }}
        >
          {multiple &&
            selectedOptions.map((option) => (
              <span className="prava-select__chip" key={option.value}>
                {option.icon != null && (
                  <span className="prava-select__icon" aria-hidden="true">
                    {option.icon}
                  </span>
                )}
                <span className="prava-select__chip-label">{option.label}</span>
                <button
                  type="button"
                  tabIndex={-1}
                  disabled={disabled}
                  className="prava-select__chip-remove"
                  aria-label={fillMessage(
                    messages.removeOption,
                    { label: textOf(option) },
                    locale,
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() =>
                    commit(selected.filter((v) => v !== option.value))
                  }
                >
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M4.5 4.5l7 7m0-7l-7 7" />
                  </svg>
                </button>
              </span>
            ))}
          <button
            {...triggerProps}
            ref={triggerRef}
            id={triggerId}
            type="button"
            role="combobox"
            disabled={disabled}
            className="prava-select__trigger"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listId}
            aria-invalid={ariaInvalid}
            aria-describedby={describedBy}
            aria-required={required || triggerProps["aria-required"]}
            aria-activedescendant={
              open && !searchable && active !== undefined
                ? optionId(active)
                : undefined
            }
            onClick={() => (open ? close() : openList())}
          >
            {single ? (
              <>
                {single.icon != null && (
                  <span className="prava-select__icon" aria-hidden="true">
                    {single.icon}
                  </span>
                )}
                <span className="prava-select__value">{single.label}</span>
              </>
            ) : multiple && selected.length ? (
              <span className="prava-select__sr-only">
                {fillMessage(
                  messages.selectedCount,
                  { count: selected.length },
                  locale,
                )}
              </span>
            ) : (
              <span className="prava-select__placeholder">{placeholder}</span>
            )}
          </button>
          <svg
            className="prava-select__chevron"
            viewBox="0 0 16 16"
            aria-hidden="true"
            onClick={() => triggerRef.current?.click()}
          >
            <path d="M4.5 6.25 8 9.75l3.5-3.5" />
          </svg>
        </div>
        <select
          {...handlers}
          ref={mergedSelectRef}
          hidden
          tabIndex={-1}
          multiple={multiple}
          name={name}
          form={form}
          required={required}
          disabled={disabled}
          defaultValue={multiple ? selected : (selected[0] ?? "")}
        >
          {!multiple && <option value="" ref={optionRef} />}
          {flat.map((option) => (
            <option
              key={option.value}
              ref={optionRef}
              value={option.value}
              disabled={option.disabled}
            />
          ))}
        </select>
        <div
          ref={popupRef}
          popover="manual"
          className="prava-select__popup"
          data-open={open || undefined}
        >
          {everOpened && searchable && (
            <div className="prava-select__search">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <circle cx="7" cy="7" r="4.5" />
                <path d="M10.5 10.5 13.5 13.5" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                role="combobox"
                className="prava-select__search-input"
                value={query}
                placeholder={messages.search}
                aria-label={messages.search}
                aria-autocomplete="list"
                aria-expanded={open}
                aria-controls={listId}
                aria-activedescendant={
                  open && active !== undefined ? optionId(active) : undefined
                }
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(undefined);
                }}
              />
            </div>
          )}
          <div
            id={listId}
            role="listbox"
            className="prava-select__list"
            aria-labelledby={triggerId}
            aria-multiselectable={multiple || undefined}
          >
            {everOpened &&
              visible.map((entry, i) =>
                isGroup(entry) ? (
                  <div
                    key={i}
                    role="group"
                    aria-labelledby={`${listId}-group-${i}`}
                  >
                    <div
                      id={`${listId}-group-${i}`}
                      className="prava-select__group-label"
                    >
                      {entry.label}
                    </div>
                    {entry.options.map(row)}
                  </div>
                ) : (
                  row(entry)
                ),
              )}
            {everOpened && enabled.length === 0 && (
              <div className="prava-select__empty" role="status">
                {messages.noResults}
              </div>
            )}
          </div>
        </div>
      </div>
      {field.messages}
    </span>
  );
}

/**
 * A custom dropdown with an options API, icons, groups, multi-select, and search, backed by a hidden
 * native select so forms, native validation, and react-hook-form keep working.
 * @example
 * ```tsx
 * import { Select } from '@prava-ui/react/select';
 * <Select
 *   label={t('role')}
 *   placeholder={t('chooseRole')}
 *   field={register('role')}
 *   error={errors.role?.message}
 *   options={[{ value: 'admin', label: <Trans id="admin">Admin</Trans>, searchText: t('admin'), icon: <Shield /> }]}
 * />
 * ```
 */
export const Select = forwardRef(SelectImpl) as <
  T extends SelectOption = SelectOption,
>(
  props: SelectProps<T> & RefAttributes<HTMLSelectElement>,
) => ReactElement | null;
