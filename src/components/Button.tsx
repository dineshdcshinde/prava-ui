import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
/** Defines the visual style of the button. */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = ['prava-button', className].filter(Boolean).join(' ');

  return (
    <button
      {...props}
      className={classes}
      data-variant={variant}
      data-size={size}
      disabled={disabled || loading}
      aria-busy={loading || props['aria-busy']}
    >
      {loading && <span className="prava-button__spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
