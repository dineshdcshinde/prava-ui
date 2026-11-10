import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  MouseEvent,
  ReactNode,
} from "react";
import { Spinner } from "../spinner";

type ButtonCommonProps = {
  /** Selects the semantic visual treatment. */
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  /** Selects the button's compact, default, or spacious dimensions. */
  size?: "sm" | "md" | "lg";
  /** Shows a spinner and blocks activation while keeping the button focusable. */
  loading?: boolean;
  /** Disables the button's press, transition, and loading animations. */
  disableAnimation?: boolean;
  /** Adds a decorative icon before the label (left in LTR, right in RTL). */
  startIcon?: ReactNode;
  /** Adds a decorative icon after the label (right in LTR, left in RTL). */
  endIcon?: ReactNode;
  /** Stretches the button to the width of its container. */
  fullWidth?: boolean;
  /** Button label or content. */
  children?: ReactNode;
};

type NativeButtonProps = ButtonCommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & { href?: undefined };

/** Props for the Prava UI Button. Pass `href` to render a link styled as a button. */
export type ButtonProps =
  | (NativeButtonProps & {
      /** Selects the native button action. */
      type?: "button" | "submit" | "reset";
    })
  | (NativeButtonProps & {
      /** Selects icon-only presentation and requires an accessible name. */
      type: "icon";
      /** Names the icon-only button for assistive technology. */
      "aria-label": string;
    })
  | (ButtonCommonProps &
      Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "type"> & {
        /** Renders an `<a>` with button styling. */
        href: string;
        /** Removes the link from navigation and the tab order. */
        disabled?: boolean;
        type?: undefined;
      });

/**
 * Renders an accessible action button, or a link styled as one when `href` is set.
 * @example
 * ```tsx
 * import { Button } from '@prava-ui/react/button';
 *
 * <Button startIcon={<PlusIcon />}>New project</Button>
 * <Button href="/billing" variant="secondary">View billing</Button>
 * ```
 */
export function Button(allProps: ButtonProps) {
  const {
    variant,
    size = "md",
    type = "button",
    loading = false,
    disableAnimation = false,
    disabled = false,
    fullWidth = false,
    className,
    startIcon,
    endIcon,
    children,
    ...props
  } = allProps;
  const isIcon = type === "icon";
  const shared = {
    className: ["prava-button", className].filter(Boolean).join(" "),
    "data-variant": variant ?? (isIcon ? "ghost" : "primary"),
    "data-size": size,
    "data-type": isIcon ? "icon" : "button",
    "data-motion": disableAnimation ? "none" : "default",
    "data-loading": loading || undefined,
    "data-full-width": fullWidth || undefined,
    "aria-busy": loading || props["aria-busy"],
  };
  const content = (
    <>
      <span className="prava-button__content">
        {startIcon && (
          <span className="prava-button__icon" aria-hidden="true">
            {startIcon}
          </span>
        )}
        {children}
        {endIcon && (
          <span className="prava-button__icon" aria-hidden="true">
            {endIcon}
          </span>
        )}
      </span>
      {loading && (
        <span className="prava-button__loader" aria-hidden="true">
          <Spinner size={size === "lg" ? "md" : "sm"} color="currentColor" />
        </span>
      )}
    </>
  );

  if (allProps.href !== undefined) {
    const { href, onClick, ...anchorProps } =
      props as AnchorHTMLAttributes<HTMLAnchorElement>;
    const blocked = disabled || loading;
    return (
      <a
        {...anchorProps}
        {...shared}
        href={disabled ? undefined : href}
        aria-disabled={blocked || undefined}
        onClick={(event: MouseEvent<HTMLAnchorElement>) =>
          blocked ? event.preventDefault() : onClick?.(event)
        }
      >
        {content}
      </a>
    );
  }

  const { onClick, ...buttonProps } =
    props as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      {...buttonProps}
      {...shared}
      type={isIcon ? "button" : (type as "button" | "submit" | "reset")}
      disabled={disabled}
      aria-disabled={loading || undefined}
      onClick={(event) => (loading ? event.preventDefault() : onClick?.(event))}
    >
      {content}
    </button>
  );
}
