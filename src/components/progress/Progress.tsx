import type { CSSProperties, HTMLAttributes } from "react";
import { usePravaConfig } from "../provider/PravaProvider";

export type ProgressProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  /** Current value; omit for an indeterminate task. */
  value?: number;
  /** Start of the progress range. */
  min?: number;
  /** End of the progress range; must be greater than `min`. */
  max?: number;
  /** Accessible name describing the task being measured. */
  label: string;
  /** Shows the label and the percentage (formatted for the provider locale) above the bar. */
  showValue?: boolean;
};

/** Communicates determinate or indeterminate task progress with accessible progressbar semantics. */
export function Progress({
  value,
  min = 0,
  max = 100,
  label,
  showValue = false,
  className,
  style,
  ...props
}: ProgressProps) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    throw new RangeError(
      "Progress max must be a finite number greater than min.",
    );
  }
  if (value !== undefined && !Number.isFinite(value)) {
    throw new RangeError("Progress value must be a finite number.");
  }

  const clampedValue =
    value === undefined ? undefined : Math.min(max, Math.max(min, value));
  const percentage =
    clampedValue === undefined
      ? undefined
      : ((clampedValue - min) / (max - min)) * 100;

  const { locale } = usePravaConfig();

  return (
    <div
      {...props}
      className={["prava-progress", className].filter(Boolean).join(" ")}
      role="progressbar"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={clampedValue}
      style={{
        ...style,
        ...(percentage === undefined
          ? {}
          : ({ "--prava-progress-value": `${percentage}%` } as CSSProperties)),
      }}
      data-indeterminate={value === undefined ? "" : undefined}
    >
      {showValue && (
        <span className="prava-progress__header" aria-hidden="true">
          <span>{label}</span>
          {percentage !== undefined && (
            <span className="prava-progress__value">
              {new Intl.NumberFormat(locale, {
                style: "percent",
                maximumFractionDigits: 0,
              }).format(percentage / 100)}
            </span>
          )}
        </span>
      )}
      <span className="prava-progress__track" aria-hidden="true">
        <span className="prava-progress__indicator" />
      </span>
    </div>
  );
}
