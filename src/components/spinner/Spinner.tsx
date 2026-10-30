import type { CSSProperties, HTMLAttributes } from 'react';

function SpinnerArc() {
  return <svg className="prava-spinner__indicator" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" /></svg>;
}

function SpinnerDots() {
  return <span className="prava-spinner__dots" aria-hidden="true"><span /><span /><span /></span>;
}

function SpinnerBars() {
  return <span className="prava-spinner__bars" aria-hidden="true"><span /><span /><span /></span>;
}

function SpinnerPulse() {
  return <span className="prava-spinner__pulse" aria-hidden="true" />;
}

function SpinnerBounce() {
  return <span className="prava-spinner__bounce" aria-hidden="true"><span /><span /><span /></span>;
}

const spinnerVariants = {
  spinner: SpinnerArc,
  dots: SpinnerDots,
  bars: SpinnerBars,
  pulse: SpinnerPulse,
  bounce: SpinnerBounce,
};

export type SpinnerProps = HTMLAttributes<HTMLSpanElement> & {
  /** Optional status text for assistive technology. */
  label?: string;
  /** Indicator diameter. */
  size?: 'sm' | 'md' | 'lg';
  /** Loading indicator style. */
  variant?: 'spinner' | 'dots' | 'bars' | 'pulse' | 'bounce';
  /** Semantic color theme; follows Prava's active light or dark tokens. */
  theme?: 'primary' | 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  /** CSS color value, including a CSS custom property. Defaults to the primary token. */
  color?: CSSProperties['color'];
};

/** Shows an ongoing process. Pass a label when the loading status needs to be announced. */
export function Spinner({ label, size = 'md', variant = 'spinner', theme = 'primary', color, className, style, ...props }: SpinnerProps) {
  const Indicator = spinnerVariants[variant];

  return (
    <span
      {...props}
      style={{ ...style, ...(color ? { color } : {}) }}
      className={['prava-spinner', className].filter(Boolean).join(' ')}
      data-size={size}
      data-variant={variant}
      data-theme={theme}
      role={label ? 'status' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <Indicator />
    </span>
  );
}
