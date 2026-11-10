import type { HTMLAttributes } from "react";

/** Native root attributes for a Card. */
export type CardProps = HTMLAttributes<HTMLDivElement>;
/** Native header attributes for a Card. */
export type CardHeaderProps = HTMLAttributes<HTMLElement>;
/** Native content attributes for a Card. */
export type CardContentProps = HTMLAttributes<HTMLDivElement>;
/** Native footer attributes for a Card. */
export type CardFooterProps = HTMLAttributes<HTMLElement>;

/**
 * Groups related content without adding click behavior or heading semantics.
 * @example
 * ```tsx
 * import { Card, CardContent, CardHeader } from '@prava-ui/react/card';
 *
 * <Card><CardHeader><h2>Account</h2></CardHeader><CardContent>Profile details</CardContent></Card>
 * ```
 */
export function Card({ className, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={["prava-card", className].filter(Boolean).join(" ")}
    />
  );
}

/**
 * Optional top section for a Card; choose heading levels in the consuming page.
 * @example
 * ```tsx
 * import { Card, CardHeader } from '@prava-ui/react/card';
 *
 * <Card><CardHeader><h2>Settings</h2></CardHeader></Card>
 * ```
 */
export function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <header
      {...props}
      className={["prava-card__header", className].filter(Boolean).join(" ")}
    />
  );
}

/**
 * Main content section for a Card.
 * @example
 * ```tsx
 * import { Card, CardContent } from '@prava-ui/react/card';
 *
 * <Card><CardContent>Your account details appear here.</CardContent></Card>
 * ```
 */
export function CardContent({ className, ...props }: CardContentProps) {
  return (
    <div
      {...props}
      className={["prava-card__content", className].filter(Boolean).join(" ")}
    />
  );
}

/**
 * Optional bottom section for Card actions or supporting content.
 * @example
 * ```tsx
 * import { Card, CardFooter } from '@prava-ui/react/card';
 *
 * <Card><CardFooter><button type="button">Save</button></CardFooter></Card>
 * ```
 */
export function CardFooter({ className, ...props }: CardFooterProps) {
  return (
    <footer
      {...props}
      className={["prava-card__footer", className].filter(Boolean).join(" ")}
    />
  );
}
