import type { LabelHTMLAttributes, ReactNode } from "react";
import { usePravaConfig } from "../provider/PravaProvider";

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  /** Marks the associated form control as required and presents a readable cue. */
  required?: boolean;
  children: ReactNode;
};

/**
 * Names a form control using native label association and readable required text.
 * @example
 * ```tsx
 * import { Label } from '@prava-ui/react/label';
 * <Label htmlFor="email" required>Email address</Label>
 * ```
 */
export function Label({
  required = false,
  className,
  children,
  ...props
}: LabelProps) {
  const { messages } = usePravaConfig();
  return (
    <label
      {...props}
      className={["prava-label", className].filter(Boolean).join(" ")}
    >
      <span>{children}</span>
      {required && (
        <span className="prava-label__required">{messages.required}</span>
      )}
    </label>
  );
}
