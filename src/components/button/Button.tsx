import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonBaseProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  /** Selects the semantic visual treatment. */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  /** Selects the button's compact, default, or spacious dimensions. */
  size?: 'sm' | 'md' | 'lg';
  /** Shows a busy indicator and disables the button until loading ends. */
  loading?: boolean;
  /** Adds a decorative icon before the button label. */
  leftIcon?: ReactNode;
  /** Adds a decorative icon after the button label. */
  rightIcon?: ReactNode;
  /** Button label or content. */
  children?: ReactNode;
};

const variantClasses = {
  primary: 'border-transparent bg-[var(--prava-color-primary)] text-[var(--prava-color-on-primary)] shadow-[var(--prava-shadow-control)] hover:bg-[var(--prava-color-primary-hover)] hover:shadow-[var(--prava-shadow-control-hover)] active:shadow-[var(--prava-shadow-control)]',
  secondary: 'border-[var(--prava-color-border)] bg-[var(--prava-color-surface)] text-[var(--prava-color-text)] shadow-[var(--prava-shadow-control)] hover:bg-[var(--prava-color-surface-hover)] hover:shadow-[var(--prava-shadow-control-hover)] active:shadow-[var(--prava-shadow-control)]',
  outline: 'border-[var(--prava-color-border)] bg-transparent text-[var(--prava-color-text)] shadow-none hover:bg-[var(--prava-color-surface-hover)] active:shadow-none',
  ghost: 'border-transparent bg-transparent text-[var(--prava-color-text)] shadow-none hover:bg-[var(--prava-color-surface-hover)] active:shadow-none',
  destructive: 'border-transparent bg-[var(--prava-color-danger)] text-[var(--prava-color-on-primary)] shadow-[var(--prava-shadow-control)] hover:bg-[var(--prava-color-danger-hover)] hover:shadow-[var(--prava-shadow-control-hover)] active:shadow-[var(--prava-shadow-control)]',
} as const;

const sizeClasses = {
  sm: 'min-h-[2rem] px-[.625rem] py-[.375rem] text-[.875rem]',
  md: 'min-h-[2.5rem] px-[.875rem] py-[.5rem] text-[1rem]',
  lg: 'min-h-[3rem] px-[1.125rem] py-[.75rem] text-[1rem]',
} as const;

const iconSizeClasses = {
  sm: 'size-[2rem] p-0',
  md: 'size-[2.5rem] p-0',
  lg: 'size-[3rem] p-0',
} as const;

/** Props for the native Prava UI Button. */
export type ButtonProps = ButtonBaseProps & (
  | {
      /** Selects the native button action. */
      type?: 'button' | 'submit' | 'reset';
      /** Provides an accessible name when the button has no visible label. */
      'aria-label'?: string;
    }
  | {
      /** Selects icon-only presentation and requires an accessible name. */
      type: 'icon';
      /** Names the icon-only button for assistive technology. */
      'aria-label': string;
    }
);

/**
 * Renders an accessible action button with consistent size and variant styles.
 * @example
 * ```tsx
 * import { Button } from 'prava-ui/button';
 *
 * <Button variant="primary">Save changes</Button>
 * ```
 */
export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled = false,
  className,
  leftIcon,
  rightIcon,
  children,
  ...props
}: ButtonProps) {
  const isIcon = type === 'icon';
  const classes = [
    'prava-button inline-flex max-w-full items-center justify-center gap-[.5rem] rounded-[var(--prava-radius-control)] border font-[inherit] font-[600] leading-[1.25] text-center transition-[background-color,color,border-color,box-shadow,transform] duration-[var(--prava-duration-fast)] ease-[var(--prava-ease-standard)] hover:-translate-y-px active:translate-y-0 active:scale-[.985] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[var(--prava-color-focus)] disabled:cursor-not-allowed disabled:opacity-[.58] disabled:shadow-none motion-reduce:transition-none motion-reduce:hover:transform-none motion-reduce:active:transform-none',
    variantClasses[variant],
    sizeClasses[size],
    isIcon && iconSizeClasses[size],
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      {...props}
      type={isIcon ? 'button' : type}
      className={classes}
      data-variant={variant}
      data-size={size}
      data-type={isIcon ? 'icon' : 'button'}
      disabled={disabled || loading}
      aria-busy={loading || props['aria-busy']}
    >
      {loading && <span className="prava-button__spinner size-[1rem] shrink-0 animate-spin rounded-[9999px] border-2 border-current border-e-transparent motion-reduce:animate-none" aria-hidden="true" />}
      {!loading && leftIcon && <span className="prava-button__icon" aria-hidden="true">{leftIcon}</span>}
      {children}
      {!loading && rightIcon && <span className="prava-button__icon" aria-hidden="true">{rightIcon}</span>}
    </button>
  );
}
