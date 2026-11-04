import { createContext, useContext, useMemo, type ReactNode } from "react";

/** Library-owned text. Override any entry through `PravaProvider` `messages`. */
export type BuiltInMessages = {
  /** Announced after a required field label. */
  required: string;
  /** Announced while a component is busy. */
  loading: string;
  /** Close buttons on Dialog and Drawer. */
  close: string;
  /** Dismiss buttons on Alert and Toast. */
  dismiss: string;
  /** Accessible name of the Toast region. */
  notifications: string;
  /** Select search box label and placeholder. */
  search: string;
  /** Select list when nothing matches the search. */
  noResults: string;
  /** Select chip remove button; `{label}` is the option's text. */
  removeOption: string;
  /** Select multi-value summary for screen readers; `{count}` is locale-formatted. */
  selectedCount: string;
  /**
   * Validation messages shown when a native constraint fails, named after `ValidityState`.
   * `{minLength}`, `{maxLength}`, `{min}`, and `{max}` are replaced with locale-formatted values.
   */
  valueMissing: string;
  /** `valueMissing` for checkboxes, radio groups, and selects. */
  valueMissingChoice: string;
  typeMismatchEmail: string;
  typeMismatchUrl: string;
  badInput: string;
  patternMismatch: string;
  tooShort: string;
  tooLong: string;
  rangeUnderflow: string;
  rangeOverflow: string;
  stepMismatch: string;
};

const defaultMessages: BuiltInMessages = {
  required: "Required",
  loading: "Loading",
  close: "Close",
  dismiss: "Dismiss",
  notifications: "Notifications",
  search: "Search",
  noResults: "No results",
  removeOption: "Remove {label}",
  selectedCount: "{count} selected",
  valueMissing: "Fill in this field.",
  valueMissingChoice: "Select an option.",
  typeMismatchEmail: "Enter a valid email address.",
  typeMismatchUrl: "Enter a valid URL.",
  badInput: "Enter a valid value.",
  patternMismatch: "Match the requested format.",
  tooShort: "Use at least {minLength} characters.",
  tooLong: "Use no more than {maxLength} characters.",
  rangeUnderflow: "Enter {min} or more.",
  rangeOverflow: "Enter {max} or less.",
  stepMismatch: "Enter a valid value.",
};

type PravaConfig = {
  direction: "ltr" | "rtl";
  locale: string;
  messages: BuiltInMessages;
};

const PravaContext = createContext<PravaConfig>({
  direction: "ltr",
  locale: "en",
  messages: defaultMessages,
});

/** Reads the nearest provider configuration, or the documented defaults outside one. */
export const usePravaConfig = () => useContext(PravaContext);

export type PravaProviderProps = {
  /** Text direction for this subtree. Does not change the document's direction. */
  direction?: "ltr" | "rtl";
  /** Active locale for built-in messages and formatting; also sets `lang` on the subtree. */
  locale?: string;
  /** Overrides for library-owned labels and announcements. */
  messages?: Partial<BuiltInMessages>;
  /** Color theme for this subtree. `system` follows the user's OS preference. Omit to inherit. */
  theme?: "light" | "dark" | "system";
  children: ReactNode;
};

/**
 * Scopes direction, locale, messages, and theme to its subtree without adding layout.
 * @example
 * ```tsx
 * import { PravaProvider } from 'prava-ui/provider';
 *
 * <PravaProvider direction="rtl" locale="ar" theme="system" messages={{ required: 'مطلوب' }}>
 *   <App />
 * </PravaProvider>
 * ```
 */
export function PravaProvider({
  direction = "ltr",
  locale,
  messages,
  theme,
  children,
}: PravaProviderProps) {
  const parent = useContext(PravaContext);
  const config = useMemo(
    () => ({
      direction,
      locale: locale ?? parent.locale,
      messages: { ...parent.messages, ...messages },
    }),
    [direction, locale, messages, parent],
  );

  return (
    <PravaContext.Provider value={config}>
      <div
        className="prava-provider"
        dir={direction}
        lang={locale}
        data-prava-theme={theme}
      >
        {children}
      </div>
    </PravaContext.Provider>
  );
}
