import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonBaseProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & {
  /** Selects the semantic visual treatment. */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  /** Selects the button's compact, default, or spacious dimensions. */
  size?: 'sm' | 'md' | 'lg';
  /** Shows a busy indicator and disables the button until loading ends. */
  loading?: boolean;
  /** Selects the loading indicator shown while the button is busy. */
  loadingVariant?: 'spinner' | 'dots' | 'bars' | 'pulse' | 'bounce';
  /** Disables the button's hover, press, transition, and loading animations. */
  disableAnimation?: boolean;
  /** Adds a decorative icon before the button label. */
  leftIcon?: ReactNode;
  /** Adds a decorative icon after the button label. */
  rightIcon?: ReactNode;
  /** Button label or content. */
  children?: ReactNode;
};

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
 * <Button variant="primary" disableAnimation>Save changes</Button>
 * ```
 */
export function Button({
  variant,
  size = 'md',
  type = 'button',
  loading = false,
  loadingVariant = 'spinner',
  disableAnimation = false,
  disabled = false,
  className,
  leftIcon,
  rightIcon,
  children,
  ...props
}: ButtonProps) {
  const isIcon = type === 'icon';
  const buttonVariant = variant ?? (isIcon ? 'ghost' : 'primary');

  return (
    <button
      {...props}
      type={isIcon ? 'button' : type}
      className={['prava-button', className].filter(Boolean).join(' ')}
      data-variant={buttonVariant}
      data-size={size}
      data-type={isIcon ? 'icon' : 'button'}
      data-motion={disableAnimation ? 'none' : 'default'}
      data-loading={loading || undefined}
      data-loading-variant={loadingVariant}
      disabled={disabled || loading}
      aria-busy={loading || props['aria-busy']}
    >
      <span className="prava-button__content">
        {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
        {children}
        {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
      </span>
      {loading && (
        <span className="prava-button__loader" aria-hidden="true" data-variant={loadingVariant}>
          {loadingVariant === 'spinner' && <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /></svg>}
          {loadingVariant === 'dots' && <><i /><i /><i /></>}
          {loadingVariant === 'bars' && <><i /><i /><i /></>}
          {loadingVariant === 'pulse' && <i />}
          {loadingVariant === 'bounce' && <><i /><i /><i /></>}
        </span>
      )}
    </button>
  );
}
