import type { LabelHTMLAttributes, ReactNode } from "react";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  /** Marks the associated form control as required and presents a readable cue. */
  required?: boolean;
  children: ReactNode;
};

/**
 * Names a form control using native label association and readable required text.
 * @example
 * ```tsx
 * import { Label } from 'prava-ui/label';
 * <Label htmlFor="email" required>Email address</Label>
 * ```
 */
export function Label({
  required = false,
  className,
  children,
  ...props
}: LabelProps) {
  return (
    <label
      {...props}
      className={["prava-label", className].filter(Boolean).join(" ")}
    >
      <span>{children}</span>
      {required && <span className="prava-label__required">Required</span>}
    </label>
  );
}
