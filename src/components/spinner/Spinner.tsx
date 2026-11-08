import { useId } from "react";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

function SpinnerArc() {
  return (
    <svg
      className="prava-spinner__indicator"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="prava-spinner__track" cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function SpinnerDots() {
  return (
    <span className="prava-spinner__dots" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function SpinnerBars() {
  return (
    <span className="prava-spinner__bars" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function SpinnerPulse() {
  return <span className="prava-spinner__pulse" aria-hidden="true" />;
}

function SpinnerBounce() {
  return (
    <span className="prava-spinner__bounce" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

const spinnerVariants = {
  spinner: SpinnerArc,
  dots: SpinnerDots,
  bars: SpinnerBars,
  pulse: SpinnerPulse,
  bounce: SpinnerBounce,
};

export type SpinnerProps = HTMLAttributes<HTMLSpanElement> & {
  /** Optional status text for assistive technology; accepts translated elements such as `<Trans>`. */
  label?: ReactNode;
  /** Indicator diameter. */
  size?: "sm" | "md" | "lg";
  /** Loading indicator style. */
  variant?: "spinner" | "dots" | "bars" | "pulse" | "bounce";
  /** Semantic color; follows the active light or dark tokens. */
  tone?: "primary" | "neutral" | "success" | "warning" | "danger" | "info";
  /** CSS color value, including a CSS custom property. Defaults to the primary token. */
  color?: CSSProperties["color"];
};

/** Shows an ongoing process. Pass a label when the loading status needs to be announced. */
export function Spinner({
  label,
  size = "md",
  variant = "spinner",
  tone = "primary",
  color,
  className,
  style,
  ...props
}: SpinnerProps) {
  const Indicator = spinnerVariants[variant];
  const labelId = useId();
  // aria-label only takes text, so an element label names the status by reference.
  const isText = typeof label === "string";
  const hasElementLabel = Boolean(label) && !isText;

  return (
    <span
      {...props}
      style={{ ...style, ...(color ? { color } : {}) }}
      className={["prava-spinner", className].filter(Boolean).join(" ")}
      data-size={size}
      data-variant={variant}
      data-tone={tone}
      role={label ? "status" : undefined}
      aria-label={isText ? label : undefined}
      aria-labelledby={hasElementLabel ? labelId : props["aria-labelledby"]}
      aria-hidden={label ? undefined : true}
    >
      {hasElementLabel && (
        <span id={labelId} hidden>
          {label}
        </span>
      )}
      <Indicator />
    </span>
  );
}
