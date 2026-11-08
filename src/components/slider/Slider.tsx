import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import type {
  ChangeEvent,
  CSSProperties,
  FocusEvent,
  ForwardedRef,
  InputHTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  ReactElement,
  ReactNode,
  RefAttributes,
} from "react";
import {
  bindField,
  onPropertyWrite,
  setRef,
  useField,
  type FieldProps,
} from "../field/field";
import { usePravaConfig } from "../provider/PravaProvider";

type SliderBase = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "children" | "defaultValue" | "max" | "min" | "step" | "type" | "value"
> &
  FieldProps & {
    /** Lowest value. Defaults to `0`. */
    min?: number;
    /** Highest value. Defaults to `100`. */
    max?: number;
    /** Distance between allowed values, counted from `min`. Defaults to `1`. */
    step?: number;
    /** Visible label above the track. */
    label?: ReactNode;
    /** Shows the current value or range, formatted for the provider's locale. */
    showValue?: boolean;
  };

export type SliderSingleProps = SliderBase & {
  /** Controlled value. Out-of-range and off-step values show as the nearest allowed value. */
  value?: number;
  /** Starting value when uncontrolled. Defaults to the middle of the scale, like a native range input. */
  defaultValue?: number;
  /** Called with the new value when the user moves the thumb. */
  onValueChange?: (value: number) => void;
};

export type SliderRangeProps = SliderBase & {
  /** Controlled `[low, high]`. A pair makes this a range with two thumbs that cannot cross. */
  value?: readonly [number, number];
  /** Starting `[low, high]` when uncontrolled. A pair makes this a range with two thumbs that cannot cross. */
  defaultValue?: readonly [number, number];
  /** Called with the new `[low, high]` when the user moves a thumb. */
  onValueChange?: (value: [number, number]) => void;
};

export type SliderProps = SliderSingleProps | SliderRangeProps;

/** The value a native range input settles on: the nearest step from `min` that fits under `max`. */
const snap = (value: number, min: number, max: number, step: number) => {
  if (max <= min) return min;
  const size = step > 0 ? step : 1;
  // toFixed removes float noise, so 0.1 + 0.2 stays on the step and 0.3 / 0.1 counts as 3 steps.
  const steps = Math.min(
    Math.round((Number(value) - min) / size),
    Math.floor(Number(((max - min) / size).toFixed(9))),
  );
  return Number((min + Math.max(steps, 0) * size).toFixed(9));
};

/** Sets the value past React's value tracker, so it takes the same path as a real thumb move. */
const moveThumb = (el: HTMLInputElement, value: number) => {
  Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set?.call(el, String(value));
  el.dispatchEvent(new Event("input", { bubbles: true }));
};

const isRtl = (el: Element) => getComputedStyle(el).direction === "rtl";

function SliderImpl(
  rawProps: SliderProps,
  forwardedRef: ForwardedRef<HTMLInputElement>,
) {
  const binding = rawProps.field;
  const range = Array.isArray(
    rawProps.value ?? rawProps.defaultValue ?? binding?.value,
  );
  // What the form library should receive: Controller keeps numbers, and a range reports its pair.
  const latest = useRef<number | [number, number]>(0);
  const report = (type: string) =>
    ({
      type,
      target: { name: binding?.name, value: latest.current },
    }) as unknown as ChangeEvent<HTMLInputElement> &
      FocusEvent<HTMLInputElement>;

  const {
    min = 0,
    max = 100,
    step = 1,
    label,
    showValue,
    value,
    defaultValue,
    onValueChange,
    description,
    error,
    invalid,
    id,
    className,
    style,
    onBlur,
    onChange,
    onInvalid,
    ref,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    ...props
  } = bindField<HTMLInputElement, SliderProps>(
    binding && (range || "value" in binding)
      ? {
          ...rawProps,
          field: {
            ...binding,
            // shortcut: register() connects one element and would write the pair into it, so a range
            // connected that way ignores setValue and reset(values); use Controller when those are needed.
            ref: "value" in binding ? binding.ref : undefined,
            onChange: () => binding.onChange?.(report("change")),
            onBlur: () => binding.onBlur?.(report("blur")),
          },
        }
      : rawProps,
    forwardedRef,
  );

  const { messages, locale } = usePravaConfig();
  const field = useField<HTMLInputElement>({
    id,
    description,
    error,
    invalid,
    onBlur,
    onChange,
    onInvalid,
    "aria-describedby": props["aria-describedby"],
    "aria-invalid": props["aria-invalid"],
  });

  const [inner, setInner] = useState<number | readonly [number, number]>(
    () => defaultValue ?? min + (max - min) / 2,
  );
  const raw = value ?? inner;
  const fit = (v: number) => snap(v, min, max, step);
  const pair: readonly number[] = Array.isArray(raw)
    ? [fit(Math.min(...raw)), fit(Math.max(...raw))]
    : [fit(raw as number)];
  const low = pair[0]!;
  const high = pair[pair.length - 1]!;
  latest.current = range ? [low, high] : low;

  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const fromTrack = useRef(false);
  const initial = useRef(raw);

  // react-hook-form's setValue and reset write the element directly, which fires no event.
  const onWrite = useCallback(() => {
    const el = inputs.current[0];
    if (el) setInner(Number(el.value));
  }, []);
  const firstRef = useCallback(
    (el: HTMLInputElement | null) => {
      inputs.current[0] = el;
      if (el && !range) onPropertyWrite(el, "value", onWrite);
      setRef(ref, el);
    },
    [range, onWrite, ref],
  );
  const secondRef = useCallback((el: HTMLInputElement | null) => {
    inputs.current[1] = el;
  }, []);

  // Native form.reset() only restores the value attribute, which React keeps equal to the current value.
  useEffect(() => {
    const owner = inputs.current[0]?.form;
    if (!owner) return;
    const onReset = () => setInner(initial.current);
    owner.addEventListener("reset", onReset);
    return () => owner.removeEventListener("reset", onReset);
  }, []);

  const change = (thumb: number) => (event: ChangeEvent<HTMLInputElement>) => {
    const el = event.currentTarget;
    let next = fit(Number(el.value));
    if (range) {
      next = thumb === 0 ? Math.min(next, high) : Math.max(next, low);
      el.value = String(next);
    }
    if (next === pair[thumb]) return;
    const nextValue: number | [number, number] = !range
      ? next
      : thumb === 0
        ? [next, high]
        : [low, next];
    latest.current = nextValue;
    setInner(nextValue);
    field.controlProps.onChange(event);
    (onValueChange as ((v: number | [number, number]) => void) | undefined)?.(
      nextValue,
    );
  };

  // Stacked range inputs only take pointers on their thumbs, so a press on the track is handled here.
  // WCAG 2.5.7 needs a way that isn't dragging; a single native input already does this itself.
  const pressTrack = (event: MouseEvent<HTMLDivElement>) => {
    if (!range || props.disabled || !fromTrack.current) return;
    const box = event.currentTarget.getBoundingClientRect();
    const share =
      (event.clientX - box.left - box.height / 2) / (box.width - box.height);
    const target =
      min + (isRtl(event.currentTarget) ? 1 - share : share) * (max - min);
    const el = inputs.current[target - low < high - target ? 0 : 1];
    if (!el) return;
    moveThumb(el, target);
    el.focus();
  };

  // WebKit doesn't mirror the arrows in RTL, so ArrowLeft would move the thumb right. Same result in every engine.
  const mirrorArrows = (event: KeyboardEvent<HTMLInputElement>) => {
    props.onKeyDown?.(event);
    const { key, currentTarget: el } = event;
    if (
      event.defaultPrevented ||
      (key !== "ArrowLeft" && key !== "ArrowRight") ||
      !isRtl(el)
    )
      return;
    event.preventDefault();
    moveThumb(el, Number(el.value) + (key === "ArrowLeft" ? step : -step));
  };

  const format = (v: number) => new Intl.NumberFormat(locale).format(v);
  const fraction = (v: number) => (max > min ? (v - min) / (max - min) : 0);
  const labelId = `${field.id}-label`;
  const ids = [field.id, `${field.id}-max`];
  const thumbNames = [messages.minimumValue, messages.maximumValue];

  return (
    <div
      className={["prava-field prava-slider", className]
        .filter(Boolean)
        .join(" ")}
      style={style}
      data-range={range || undefined}
      data-disabled={props.disabled || undefined}
      data-invalid={field.controlProps["aria-invalid"]}
    >
      {(label != null || showValue) && (
        <div className="prava-slider__header">
          {label != null &&
            (range ? (
              <span id={labelId} className="prava-field__legend">
                {label}
              </span>
            ) : (
              <label htmlFor={field.id} className="prava-field__legend">
                {label}
              </label>
            ))}
          {showValue && (
            // A span, not <output>: form.reset() would wipe an output's text, and the thumb already announces.
            <span className="prava-slider__value">
              {pair.map(format).join(" – ")}
            </span>
          )}
        </div>
      )}
      <div
        className="prava-slider__control"
        onPointerDown={(event) => {
          fromTrack.current = !(event.target instanceof HTMLInputElement);
        }}
        onClick={pressTrack}
      >
        <div className="prava-slider__track">
          <div
            className="prava-slider__fill"
            style={
              {
                "--prava-slider-start": fraction(low),
                "--prava-slider-end": fraction(high),
              } as CSSProperties
            }
          />
        </div>
        {pair.map((thumbValue, thumb) => (
          <input
            {...props}
            {...field.controlProps}
            key={thumb}
            ref={thumb === 0 ? firstRef : secondRef}
            id={ids[thumb]}
            type="range"
            className="prava-slider__input"
            min={min}
            max={max}
            step={step}
            value={thumbValue}
            aria-valuetext={props["aria-valuetext"] ?? format(thumbValue)}
            // Each thumb is named for the slider and for its own end: "Price Minimum".
            aria-label={
              range
                ? [ariaLabel, thumbNames[thumb]].filter(Boolean).join(" ")
                : ariaLabel
            }
            aria-labelledby={
              range && (label != null || ariaLabelledBy)
                ? `${ariaLabelledBy ?? labelId} ${ids[thumb]}`
                : ariaLabelledBy
            }
            // At the far end the low thumb must sit on top, or neither could move.
            data-top={
              (range && thumb === 0 && low === high && high === fit(max)) ||
              undefined
            }
            onChange={change(thumb)}
            onKeyDown={mirrorArrows}
          />
        ))}
      </div>
      {field.messages}
    </div>
  );
}

/**
 * Chooses a value or a range along a scale with native range inputs, so keyboard, touch, forms and
 * assistive technology behave as the platform does. Pass a pair for two thumbs that cannot cross; they
 * submit as two entries under `name`. Connect a single value with `field={register("volume", { valueAsNumber: true })}`,
 * and a range with react-hook-form's `Controller`.
 * @example
 * ```tsx
 * import { Slider } from 'prava-ui/slider';
 * <Slider label="Volume" defaultValue={40} showValue />
 * <Slider label="Price" defaultValue={[20, 80]} step={5} showValue />
 * ```
 */
export const Slider = forwardRef(SliderImpl) as unknown as {
  (
    props: SliderSingleProps & RefAttributes<HTMLInputElement>,
  ): ReactElement | null;
  (
    props: SliderRangeProps & RefAttributes<HTMLInputElement>,
  ): ReactElement | null;
  (props: SliderProps & RefAttributes<HTMLInputElement>): ReactElement | null;
};
