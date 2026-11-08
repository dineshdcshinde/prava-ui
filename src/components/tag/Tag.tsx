import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { fillMessage } from "../field/field";
import { usePravaConfig } from "../provider/PravaProvider";
import { useControllable } from "../../internal/useControllable";

export type TagProps = HTMLAttributes<HTMLSpanElement> & {
  /** Visible tag text. */
  children: ReactNode;
  /** Semantic color, using the same status pairs as Badge. */
  tone?: "neutral" | "primary" | "success" | "warning" | "danger" | "info";
  /** Selects the compact (24px) or default (32px) height. */
  size?: "sm" | "md";
  /** Decorative icon shown before the text. */
  icon?: ReactNode;
  /** Shows a remove button. The consumer removes the tag and moves focus somewhere sensible. */
  onRemove?: () => void;
  /** Whether a selectable tag is pressed. Setting this or `onSelectedChange` makes the tag a toggle button. */
  selected?: boolean;
  /** Called with the next state on toggle. Without `selected`, the tag tracks its own state, starting unselected. */
  onSelectedChange?: (selected: boolean) => void;
};

/**
 * A compact label the user can remove or select. Use Badge for non-interactive status.
 * @example
 * ```tsx
 * import { Tag } from 'prava-ui/tag';
 * <Tag onRemove={() => removeTopic("Design")}>Design</Tag>
 * <Tag selected={active} onSelectedChange={setActive}>Open</Tag>
 * ```
 */
export const Tag = forwardRef<HTMLSpanElement, TagProps>(function Tag(
  {
    tone = "neutral",
    size = "md",
    icon,
    onRemove,
    selected,
    onSelectedChange,
    className,
    children,
    ...props
  },
  ref,
) {
  const { locale, messages } = usePravaConfig();
  const selectable = selected !== undefined || onSelectedChange !== undefined;
  const [pressed, setPressed] = useControllable(
    selected,
    false,
    onSelectedChange,
  );

  // Children may be any node, so non-string labels are named from their rendered text.
  const labelRef = useRef<HTMLSpanElement>(null);
  const [renderedText, setRenderedText] = useState("");
  useEffect(() => setRenderedText(labelRef.current?.textContent ?? ""));
  const text =
    typeof children === "string" || typeof children === "number"
      ? String(children)
      : renderedText;

  const content = (
    <>
      {selectable && (
        <span className="prava-tag__check" aria-hidden="true">
          <svg viewBox="0 0 16 16">
            <path d="M4 8.5l2.5 2.5 5.5-6" />
          </svg>
        </span>
      )}
      {icon != null && (
        <span className="prava-tag__icon" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="prava-tag__label" ref={labelRef}>
        {children}
      </span>
    </>
  );

  return (
    <span
      {...props}
      ref={ref}
      className={["prava-tag", className].filter(Boolean).join(" ")}
      data-tone={tone}
      data-size={size}
      data-selected={(selectable && pressed) || undefined}
      data-removable={onRemove ? true : undefined}
    >
      {selectable ? (
        <button
          type="button"
          className="prava-tag__content prava-tag__toggle"
          aria-pressed={pressed}
          onClick={() => setPressed(!pressed)}
        >
          {content}
        </button>
      ) : (
        <span className="prava-tag__content">{content}</span>
      )}
      {onRemove && (
        <button
          type="button"
          className="prava-tag__remove"
          aria-label={fillMessage(messages.removeTag, { label: text }, locale)}
          onClick={() => onRemove()}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4.5 4.5l7 7m0-7l-7 7" />
          </svg>
        </button>
      )}
    </span>
  );
});
