import {
  forwardRef,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { HTMLAttributes, KeyboardEvent, ReactNode } from "react";
import { useControllable } from "../../internal/useControllable";
import { usePravaConfig } from "../provider/PravaProvider";

/** Start and end as ISO `YYYY-MM-DD`; `["", ""]` means no range. */
export type DateRange = readonly [start: string, end: string];

// All date math runs on UTC days, so no local offset or daylight change can move a date.
const utc = (year: number, month: number, day: number) => {
  const date = new Date(0);
  date.setUTCFullYear(year, month, day); // Date.UTC would read years below 100 as 19xx
  return date;
};
const toIso = (date: Date) => date.toISOString().slice(0, 10);
const fields = (iso: string) =>
  iso.split("-").map(Number) as [number, number, number];
const toDate = (iso: string) => {
  const [year, month, day] = fields(iso);
  return utc(year, month - 1, day);
};

/** True for a real calendar date in `YYYY-MM-DD` form; `2025-02-29` is not one. */
export const isIsoDate = (text: unknown): text is string =>
  typeof text === "string" &&
  /^\d{4}-\d{2}-\d{2}$/.test(text) &&
  toIso(toDate(text)) === text;

export const addDays = (iso: string, days: number) => {
  const [year, month, day] = fields(iso);
  return toIso(utc(year, month - 1, day + days));
};

/** Keeps the day number, or takes the month's last day when it has no such day. */
export const addMonths = (iso: string, months: number) => {
  const [year, month, day] = fields(iso);
  const last = utc(year, month + months, 0).getUTCDate();
  return toIso(utc(year, month - 1 + months, Math.min(day, last)));
};

/** Reads `a`, `a/b` or `[a, b]` as sorted dates; anything invalid is no value. */
export const readDates = (value: unknown): [string, string] | undefined => {
  const list: unknown[] =
    typeof value === "string"
      ? value.split("/")
      : Array.isArray(value)
        ? (value as unknown[])
        : [];
  const [start, end = start] = list;
  if (!isIsoDate(start) || !isIsoDate(end)) return undefined;
  return start <= end ? [start, end] : [end, start];
};

// CLDR weekData, for browsers without Intl.Locale week info. Every other region starts on Monday.
const SUNDAY_REGIONS =
  "AG AS AU BD BR BS BT BW BZ CA CN CO DM DO ET GT GU HK HN ID IL IN JM JP KE KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW";
const SATURDAY_REGIONS = "AE AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY";

type WeekLocale = Intl.Locale & {
  getWeekInfo?: () => { firstDay: number };
  weekInfo?: { firstDay: number };
};

/** First day of the week for a locale: 0 is Sunday, 6 is Saturday. */
export const firstDayOfWeek = (locale: string) => {
  const parsed = new Intl.Locale(locale) as WeekLocale;
  const info = parsed.getWeekInfo?.() ?? parsed.weekInfo;
  if (info) return info.firstDay % 7;
  const region = parsed.maximize().region ?? "";
  if (SUNDAY_REGIONS.split(" ").includes(region)) return 0;
  return SATURDAY_REGIONS.split(" ").includes(region) ? 6 : 1;
};

/** Gregorian whatever the locale's default calendar (`th` is Buddhist, `ar-SA` Islamic), read in UTC. */
export const dateFormat = (
  locale: string,
  options: Intl.DateTimeFormatOptions,
) =>
  new Intl.DateTimeFormat(locale, {
    ...options,
    calendar: "gregory",
    timeZone: "UTC",
  });
export const formatIso = (format: Intl.DateTimeFormat, iso: string) =>
  format.format(toDate(iso));

const never = () => () => {};
const localToday = () => {
  const now = new Date();
  return toIso(utc(now.getFullYear(), now.getMonth(), now.getDate()));
};
// The server can't know the viewer's zone; the client swaps to its own day right after hydrating.
const serverToday = () => new Date().toISOString().slice(0, 10);

const Chevron = ({ double, back }: { double?: boolean; back?: boolean }) => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <g transform={back ? "matrix(-1 0 0 1 16 0)" : undefined}>
      <path d={double ? "M4 4l4 4-4 4M8.5 4l4 4-4 4" : "M6 4l4 4-4 4"} />
    </g>
  </svg>
);

type CalendarBase = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children" | "defaultValue" | "onChange"
> & {
  /** Earliest choosable date, ISO `YYYY-MM-DD`. */
  min?: string;
  /** Latest choosable date, ISO `YYYY-MM-DD`. */
  max?: string;
  /** Return true for an ISO date that can't be chosen. It stays reachable by keyboard and is announced as unavailable. */
  isDateDisabled?: (date: string) => boolean;
  /** Extra classes for inner slots; `className` goes on the root. */
  classNames?: {
    header?: string;
    title?: string;
    grid?: string;
    day?: string;
  };
};

export type CalendarProps = CalendarBase &
  (
    | {
        /** `single` picks one date; `range` picks a start and an end. */
        mode?: "single";
        /** Chosen date as ISO `YYYY-MM-DD`; empty means none. Wins over `defaultValue`. */
        value?: string;
        /** Initial date when uncontrolled. */
        defaultValue?: string;
        /** Called with the chosen ISO date. */
        onValueChange?: (value: string) => void;
      }
    | {
        /** `single` picks one date; `range` picks a start and an end. */
        mode: "range";
        /** Chosen range as ISO `[start, end]`. Wins over `defaultValue`. */
        value?: DateRange;
        /** Initial range when uncontrolled. */
        defaultValue?: DateRange;
        /** Called with `[start, end]` once both ends are chosen, in date order. */
        onValueChange?: (value: [string, string]) => void;
      }
  );

/**
 * A month grid for choosing a date or range, following the WAI-ARIA date grid keyboard pattern.
 * Names, weekdays and the first day of the week come from `Intl` with the provider's locale.
 * @example
 * ```tsx
 * import { Calendar } from 'prava-ui/date-picker';
 * <Calendar min="2026-01-01" defaultValue="2026-11-05" onValueChange={setDate} />
 * ```
 */
export const Calendar = forwardRef<HTMLDivElement, CalendarProps>(
  function Calendar(
    {
      mode = "single",
      value,
      defaultValue,
      onValueChange,
      min,
      max,
      isDateDisabled,
      classNames,
      className,
      ...props
    },
    ref,
  ) {
    const { messages, locale } = usePravaConfig();
    const [current, setCurrent] = useControllable<unknown>(
      value,
      defaultValue,
      onValueChange as ((next: unknown) => void) | undefined,
    );
    const selected = readDates(current);
    const range = mode === "range";
    const today = useSyncExternalStore(never, localToday, serverToday);
    const titleId = useId();
    const gridRef = useRef<HTMLTableElement>(null);
    const moveDomFocus = useRef(false);

    const [moved, setMoved] = useState<string>();
    const [pending, setPending] = useState<string>();
    const [hovered, setHovered] = useState<string>();

    const low = isIsoDate(min) ? min : "0001-01-01";
    const high = isIsoDate(max) ? max : "9999-12-31";
    const clamp = (iso: string) => (iso < low ? low : iso > high ? high : iso);
    const active = clamp(moved ?? selected?.[0] ?? today);
    const unavailable = (iso: string) =>
      iso < low || iso > high || Boolean(isDateDisabled?.(iso));

    // A value set from outside shows its own month; picking inside the view leaves the view alone.
    const key = selected?.join("/");
    const [lastKey, setLastKey] = useState(key);
    if (key !== lastKey) {
      setLastKey(key);
      if (selected && moved && (moved < selected[0] || moved > selected[1]))
        setMoved(undefined);
    }

    useEffect(() => {
      if (!moveDomFocus.current) return;
      moveDomFocus.current = false;
      gridRef.current
        ?.querySelector<HTMLElement>('[role="gridcell"][tabindex="0"]')
        ?.focus();
    }, [active]);

    const weekStart = useMemo(() => firstDayOfWeek(locale), [locale]);
    const formats = useMemo(
      () => ({
        title: dateFormat(locale, { month: "long", year: "numeric" }),
        full: dateFormat(locale, { dateStyle: "full" }),
        day: dateFormat(locale, { day: "numeric" }),
        narrow: dateFormat(locale, { weekday: "narrow" }),
        weekday: dateFormat(locale, { weekday: "long" }),
      }),
      [locale],
    );

    const move = (iso: string) => {
      const next = clamp(iso);
      if (next === active) return;
      moveDomFocus.current = true;
      setMoved(next);
    };
    const choose = (iso: string) => {
      if (unavailable(iso)) return;
      setMoved(iso);
      if (!range) setCurrent(iso);
      else if (!pending) setPending(iso);
      else {
        setPending(undefined);
        setHovered(undefined);
        setCurrent(iso < pending ? [iso, pending] : [pending, iso]);
      }
    };

    const onGridKeyDown = (event: KeyboardEvent<HTMLTableElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        choose(active);
        return;
      }
      const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
      const fromWeekStart = (toDate(active).getUTCDay() - weekStart + 7) % 7;
      const months = event.shiftKey ? 12 : 1;
      const targets: Record<string, () => string> = {
        ArrowLeft: () => addDays(active, rtl ? 1 : -1),
        ArrowRight: () => addDays(active, rtl ? -1 : 1),
        ArrowUp: () => addDays(active, -7),
        ArrowDown: () => addDays(active, 7),
        Home: () => addDays(active, -fromWeekStart),
        End: () => addDays(active, 6 - fromWeekStart),
        PageUp: () => addMonths(active, -months),
        PageDown: () => addMonths(active, months),
      };
      const target = targets[event.key];
      if (!target) return;
      event.preventDefault();
      move(target());
    };

    const monthStart = `${active.slice(0, 8)}01`;
    const monthEnd = addDays(addMonths(monthStart, 1), -1);
    const firstCell = addDays(
      monthStart,
      -((toDate(monthStart).getUTCDay() - weekStart + 7) % 7),
    );
    // Always six rows, so the popup keeps its height from month to month.
    const weeks = Array.from({ length: 6 }, (_, week) =>
      Array.from({ length: 7 }, (_, day) => {
        const iso = addDays(firstCell, week * 7 + day);
        return iso.slice(0, 7) === monthStart.slice(0, 7) ? iso : null;
      }),
    );
    const previewEnd = pending ? (hovered ?? active) : undefined;
    const [from, to] = pending
      ? pending <= previewEnd!
        ? [pending, previewEnd!]
        : [previewEnd!, pending]
      : (selected ?? []);

    const navButton = (
      name: string,
      icon: ReactNode,
      months: number,
      atLimit: boolean,
    ) => (
      <button
        type="button"
        className="prava-calendar__nav"
        aria-label={name}
        // Not `disabled`: that would drop focus out of a modal when the limit is reached.
        aria-disabled={atLimit || undefined}
        onClick={() => {
          if (!atLimit) setMoved(clamp(addMonths(active, months)));
        }}
      >
        {icon}
      </button>
    );

    return (
      <div
        {...props}
        ref={ref}
        className={["prava-calendar", className].filter(Boolean).join(" ")}
      >
        <div
          className={["prava-calendar__header", classNames?.header]
            .filter(Boolean)
            .join(" ")}
        >
          {navButton(
            messages.previousYear,
            <Chevron double back />,
            -12,
            monthStart <= low,
          )}
          {navButton(
            messages.previousMonth,
            <Chevron back />,
            -1,
            monthStart <= low,
          )}
          <div
            id={titleId}
            className={["prava-calendar__title", classNames?.title]
              .filter(Boolean)
              .join(" ")}
            aria-live="polite"
            aria-atomic="true"
          >
            {formatIso(formats.title, active)}
          </div>
          {navButton(messages.nextMonth, <Chevron />, 1, monthEnd >= high)}
          {navButton(
            messages.nextYear,
            <Chevron double />,
            12,
            monthEnd >= high,
          )}
        </div>
        <table
          ref={gridRef}
          role="grid"
          aria-labelledby={titleId}
          aria-multiselectable={range || undefined}
          className={["prava-calendar__grid", classNames?.grid]
            .filter(Boolean)
            .join(" ")}
          onKeyDown={onGridKeyDown}
          onMouseLeave={() => setHovered(undefined)}
        >
          <thead>
            <tr>
              {weeks[0]!.map((_, day) => {
                const date = addDays(firstCell, day);
                const name = formatIso(formats.weekday, date);
                return (
                  <th
                    key={day}
                    scope="col"
                    abbr={name}
                    aria-label={name}
                    className="prava-calendar__weekday"
                  >
                    {formatIso(formats.narrow, date)}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {weeks.map((days, week) => (
              <tr key={week}>
                {days.map((iso, day) => {
                  if (!iso) return <td key={day} role="gridcell" />;
                  const inside =
                    from !== undefined &&
                    to !== undefined &&
                    iso >= from &&
                    iso <= to;
                  const isToday = iso === today;
                  const blocked = unavailable(iso);
                  return (
                    <td
                      key={iso}
                      role="gridcell"
                      data-date={iso}
                      data-start={iso === from || undefined}
                      data-end={iso === to || undefined}
                      data-in-range={inside || undefined}
                      data-today={isToday || undefined}
                      tabIndex={iso === active ? 0 : -1}
                      aria-label={formatIso(formats.full, iso)}
                      aria-selected={pending ? iso === pending : inside}
                      aria-disabled={blocked || undefined}
                      aria-current={isToday ? "date" : undefined}
                      className={["prava-calendar__day", classNames?.day]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => choose(iso)}
                      onMouseEnter={pending ? () => setHovered(iso) : undefined}
                    >
                      <span className="prava-calendar__day-label">
                        {formatIso(formats.day, iso)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  },
);
