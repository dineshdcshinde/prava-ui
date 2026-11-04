import { cloneElement, useEffect, useState } from "react";
import type { ReactElement, RefObject, SyntheticEvent } from "react";

type Props = Record<string, unknown>;
type Handler = (event: SyntheticEvent) => void;

/** Merges handlers so the consumer's runs first and `preventDefault` opts out of Prava's. */
export function mergeHandlers(own: object, extra: Props) {
  const merged = { ...extra };
  for (const key of Object.keys(extra)) {
    const theirs = (own as Props)[key];
    const mine = extra[key];
    if (key.startsWith("on") && typeof theirs === "function") {
      merged[key] = (event: SyntheticEvent) => {
        (theirs as Handler)(event);
        if (!event.defaultPrevented) (mine as Handler)(event);
      };
    }
  }
  return merged;
}

/** Adds ARIA and handlers to a consumer's trigger element without a wrapper or a ref. */
export const cloneTrigger = (trigger: ReactElement, extra: Props) =>
  cloneElement(
    trigger as ReactElement<Props>,
    mergeHandlers((trigger as ReactElement<Props>).props, extra),
  );

/**
 * Stays true after `open` turns false until the element's exit transition ends, so content
 * can unmount without cutting the animation short. No transition (reduced motion) ends at once.
 */
export function usePresence(open: boolean, ref: RefObject<HTMLElement | null>) {
  const [mounted, setMounted] = useState(open);
  if (open && !mounted) setMounted(true);
  useEffect(() => {
    if (open || !mounted) return;
    let live = true;
    void Promise.allSettled(
      (ref.current?.getAnimations?.() ?? []).map((a) => a.finished),
    ).then(() => {
      if (live) setMounted(false);
    });
    return () => {
      live = false;
    };
  }, [open, mounted, ref]);
  return mounted;
}

let locks = 0;
let restore = () => {};

/** Stops the page scrolling behind a modal without shifting layout; nested modals share one lock. */
export function lockScroll() {
  if (locks++ === 0) {
    const { style, clientWidth } = document.documentElement;
    const { overflow, scrollbarGutter } = style;
    if (window.innerWidth > clientWidth) style.scrollbarGutter = "stable";
    style.overflow = "hidden";
    restore = () => {
      style.overflow = overflow;
      style.scrollbarGutter = scrollbarGutter;
    };
  }
  return () => {
    if (--locks === 0) restore();
  };
}

export type FloatingPlacement = "top" | "bottom" | "start" | "end";
export type FloatingAlign = "start" | "center" | "end";

type Side = "top" | "bottom" | "left" | "right";
const opposite: Record<Side, Side> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};
const clamp = (value: number, max: number, margin: number) =>
  Math.max(margin, Math.min(value, max - margin));

export type FloatingOptions = {
  /** Space between anchor and popup. */
  gap?: number;
  /** Space kept from the viewport edges. */
  margin?: number;
  /** Full height of a popup whose inner scroller hides it from `scrollHeight`. */
  contentHeight?: number;
  /** Opens beside the anchor when neither above nor below can show this many pixels. */
  minBlockRoom?: number;
  /** Keeps `placement` whenever it leaves usable room, instead of moving to a roomier side. */
  strict?: boolean;
};

/** Positions `popup` beside `anchor`, flipping to the roomier side and staying on screen. */
export function placeFloating(
  anchor: Element,
  popup: HTMLElement,
  placement: FloatingPlacement,
  align: FloatingAlign,
  {
    gap = 6,
    margin = 8,
    contentHeight,
    minBlockRoom = 0,
    strict = false,
  }: FloatingOptions = {},
) {
  const { style } = popup;
  // Measure at the origin: a stale position would shrink a fit-content popup.
  style.left = style.top = "0px";
  const rect = anchor.getBoundingClientRect();
  const computed = getComputedStyle(popup);
  const rtl = computed.direction === "rtl";
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = window.innerHeight;
  // Computed width keeps sub-pixels, so edges line up with the anchor; offsetWidth rounds them away.
  const width = parseFloat(computed.width) || popup.offsetWidth;
  // scrollHeight is the full content even when capped; clearing the cap would lose the scroll position.
  const height = contentHeight ?? popup.scrollHeight;
  const room: Record<Side, number> = {
    top: rect.top - gap - margin,
    bottom: viewportHeight - rect.bottom - gap - margin,
    left: rect.left - gap - margin,
    right: viewportWidth - rect.right - gap - margin,
  };

  const startSide: Side = rtl ? "right" : "left";
  let side: Side =
    placement === "start"
      ? startSide
      : placement === "end"
        ? opposite[startSide]
        : placement;
  const beside = side === "left" || side === "right";
  const usable =
    room[side] >= (beside ? width : Math.min(height, minBlockRoom));
  if (!strict || !usable) {
    if (
      room[side] < (beside ? width : height) &&
      room[opposite[side]] > room[side]
    )
      side = opposite[side];
    // No room beside the anchor on a narrow screen: drop below or above it.
    if ((side === "left" || side === "right") && room[side] < width)
      side = room.bottom >= room.top ? "bottom" : "top";
    // Last resort for a vertical popup on a short screen: inline-end first, then inline-start.
    if (Math.max(room.top, room.bottom) < Math.min(height, minBlockRoom)) {
      const sideways = [opposite[startSide], startSide].find(
        (candidate) => room[candidate] >= width,
      );
      if (sideways) side = sideways;
    }
  }

  let left: number;
  let top: number;
  if (side === "top" || side === "bottom") {
    const fitted = Math.min(height, Math.max(room[side], 0));
    style.maxBlockSize = fitted < height ? `${fitted}px` : "";
    top = side === "bottom" ? rect.bottom + gap : rect.top - gap - fitted;
    const leftEdge = rtl ? align === "end" : align === "start";
    left =
      align === "center"
        ? rect.left + (rect.width - width) / 2
        : leftEdge
          ? rect.left
          : rect.right - width;
    left = clamp(left, viewportWidth - width, margin);
  } else {
    const fitted = Math.min(height, viewportHeight - margin * 2);
    style.maxBlockSize = fitted < height ? `${fitted}px` : "";
    left = side === "right" ? rect.right + gap : rect.left - gap - width;
    top =
      align === "center"
        ? rect.top + (rect.height - fitted) / 2
        : align === "start"
          ? rect.top
          : rect.bottom - fitted;
    top = clamp(top, viewportHeight - fitted, margin);
  }
  popup.dataset.side = side;
  style.left = `${left}px`;
  style.top = `${top}px`;
}

/**
 * Shows `popup` in the top layer while open and keeps it attached to the first element in `root`.
 * The top layer is what lets it escape a Card, a scroll container, or a modal Dialog.
 */
export function useFloating(
  open: boolean,
  root: RefObject<HTMLElement | null>,
  popup: RefObject<HTMLElement | null>,
  placement: FloatingPlacement,
  align: FloatingAlign,
) {
  useEffect(() => {
    const el = popup.current;
    const anchor = root.current?.firstElementChild;
    if (!el || !anchor) return;
    if (!open) {
      if (el.matches?.(":popover-open")) el.hidePopover();
      return;
    }
    el.showPopover?.();
    const place = () => placeFloating(anchor, el, placement, align);
    place();
    // Scrolling inside the popup doesn't move the anchor.
    const onScroll = (event: Event) => {
      if (!el.contains(event.target as Node)) place();
    };
    window.addEventListener("resize", place);
    window.addEventListener("scroll", onScroll, true);
    const resize =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(place);
    resize?.observe(el);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", onScroll, true);
      resize?.disconnect();
    };
  }, [open, root, popup, placement, align]);
}

/** Closes on a press outside `root`, which holds both the trigger and the popup. */
export function useOutsidePress(
  open: boolean,
  root: RefObject<HTMLElement | null>,
  close: () => void,
) {
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close();
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open, root, close]);
}
