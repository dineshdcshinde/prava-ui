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
  /** Accessible name of Pagination's navigation. */
  pagination: string;
  /** Pagination previous button. */
  previousPage: string;
  /** Pagination next button. */
  nextPage: string;
  /** Pagination page button; `{page}` is locale-formatted. */
  goToPage: string;
  /** Accessible name of Breadcrumb's navigation. */
  breadcrumb: string;
  /** Breadcrumb button that reveals collapsed items. */
  showHiddenBreadcrumbs: string;
  /** Combobox result count for screen readers; `{count}` is locale-formatted. */
  resultCount: string;
  /** Combobox announcement when exactly one option matches. */
  oneResult: string;
  /** DatePicker button that opens the calendar. */
  chooseDate: string;
  /** DatePicker button once a date is chosen; `{date}` is the chosen date in words. */
  changeDate: string;
  /** Calendar previous year button. */
  previousYear: string;
  /** Calendar next year button. */
  nextYear: string;
  /** DatePicker error when a typed date is one `isDateDisabled` rejects. */
  dateUnavailable: string;
  /** Calendar previous month button. */
  previousMonth: string;
  /** Calendar next month button. */
  nextMonth: string;
  /** Range Slider's lower thumb. */
  minimumValue: string;
  /** Range Slider's upper thumb. */
  maximumValue: string;
  /** NumberInput increment button. */
  increment: string;
  /** NumberInput decrement button. */
  decrement: string;
  /** FileUpload button. */
  chooseFiles: string;
  /** FileUpload drop zone hint. */
  dropFiles: string;
  /** FileUpload remove button; `{label}` is the file name. */
  removeFile: string;
  /** FileUpload rejection; `{max}` is a formatted size. */
  fileTooLarge: string;
  /** FileUpload rejection. */
  fileTypeRejected: string;
  /** FileUpload rejection. */
  tooManyFiles: string;
  /** FileUpload rejection when the limit is one file. */
  oneFileOnly: string;
  /** Tag remove button; `{label}` is the tag's text. */
  removeTag: string;
  /** Table's scroll region when it has no caption or `aria-label`. */
  scrollableTable: string;
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
  pagination: "Pagination",
  previousPage: "Previous page",
  nextPage: "Next page",
  goToPage: "Go to page {page}",
  breadcrumb: "Breadcrumb",
  showHiddenBreadcrumbs: "Show hidden items",
  resultCount: "{count} results",
  oneResult: "1 result",
  chooseDate: "Choose date",
  changeDate: "Change date, {date}",
  previousYear: "Previous year",
  nextYear: "Next year",
  dateUnavailable: "This date isn't available.",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  minimumValue: "Minimum",
  maximumValue: "Maximum",
  increment: "Increase",
  decrement: "Decrease",
  chooseFiles: "Choose files",
  dropFiles: "or drop them here",
  removeFile: "Remove {label}",
  fileTooLarge: "{label} is larger than {max}.",
  fileTypeRejected: "{label} isn't an accepted file type.",
  tooManyFiles: "You can add up to {count} files.",
  oneFileOnly: "You can add only one file.",
  removeTag: "Remove {label}",
  scrollableTable: "Scrollable table",
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
