import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
} from "react";
import type {
  DialogHTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  ReactElement,
  ReactNode,
  SyntheticEvent,
} from "react";
import {
  cloneTrigger,
  lockScroll,
  mergeHandlers,
  usePresence,
} from "../../internal/overlay";
import { useControllable } from "../../internal/useControllable";
import { usePravaConfig } from "../provider/PravaProvider";

export type DialogProps = Omit<
  DialogHTMLAttributes<HTMLDialogElement>,
  "open" | "title"
> & {
  /** Heading that names the dialog. */
  title: ReactNode;
  /** Supporting text announced with the title. */
  description?: ReactNode;
  /** Actions pinned below the scrolling content. */
  footer?: ReactNode;
  /** Focusable element that opens the dialog, such as a Button. Omit when you control `open`. */
  trigger?: ReactElement;
  /** Open state when controlled. */
  open?: boolean;
  /** Initial open state when uncontrolled. */
  defaultOpen?: boolean;
  /** Called with the next state when the dialog asks to open or close. */
  onOpenChange?: (open: boolean) => void;
  /** Blocks the page behind it and traps focus. `false` lets people keep working around it. */
  modal?: boolean;
  /** Lets Escape and a press outside close it. Turn off when a choice is required. */
  dismissible?: boolean;
  /** Removes the close button; give people another way out in `footer`. */
  hideClose?: boolean;
  /** Maximum width. It always stays inside the viewport. */
  size?: "sm" | "md" | "lg";
  /** Extra classes for inner slots; `className` goes on the dialog root. */
  classNames?: {
    header?: string;
    title?: string;
    description?: string;
    body?: string;
    footer?: string;
    close?: string;
  };
};

const CloseContext = createContext<() => void>(() => {});

/** Makes its child close the surrounding Dialog or Drawer when pressed. */
export function DialogClose({ children }: { children: ReactElement }) {
  const close = useContext(CloseContext);
  return cloneTrigger(children, { onClick: close });
}

/**
 * A native `<dialog>`: the browser provides the top layer, focus containment and focus restoration.
 * Focus lands on the first focusable child; mark another with `data-autofocus`.
 * @example
 * ```tsx
 * import { Dialog, DialogClose } from 'prava-ui/dialog';
 *
 * <Dialog
 *   trigger={<Button>Delete project</Button>}
 *   title="Delete this project?"
 *   footer={<DialogClose><Button variant="outline">Cancel</Button></DialogClose>}
 * >
 *   This can't be undone.
 * </Dialog>
 * ```
 */
export const Dialog = forwardRef<HTMLDialogElement, DialogProps>(
  function Dialog(
    {
      title,
      description,
      footer,
      trigger,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      modal = true,
      dismissible = true,
      hideClose,
      size = "md",
      classNames,
      className,
      children,
      id: idProp,
      ...props
    },
    forwardedRef,
  ) {
    const { messages } = usePravaConfig();
    const [open, setOpen] = useControllable(
      openProp,
      defaultOpen,
      onOpenChange,
    );
    const ref = useRef<HTMLDialogElement>(null);
    useImperativeHandle(forwardedRef, () => ref.current!);
    const generatedId = useId();
    const id = idProp ?? generatedId;
    const pressedBackdrop = useRef(false);

    useEffect(() => {
      const dialog = ref.current;
      if (!dialog) return;
      if (open && !dialog.open) {
        if (modal) dialog.showModal();
        else dialog.show();
        dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
      } else if (!open && dialog.open) {
        dialog.close();
      }
    }, [open, modal]);
    // Runs after the effect above, so the exit transition has started when presence reads it.
    const mounted = usePresence(open, ref);
    useEffect(() => (open && modal ? lockScroll() : undefined), [open, modal]);

    const handlers = mergeHandlers(props, {
      // The browser's own Escape path, which also covers focus sitting outside the dialog.
      onCancel: (event: SyntheticEvent) => {
        event.preventDefault();
        if (dismissible) setOpen(false);
      },
      // Keeps state in sync when something inside closes it, such as `<form method="dialog">`.
      onClose: () => {
        if (open) setOpen(false);
      },
      onKeyDown: (event: KeyboardEvent) => {
        if (event.key !== "Escape" || event.defaultPrevented) return;
        event.preventDefault();
        event.stopPropagation(); // a Dialog nested in a Dialog closes one level at a time
        if (dismissible) setOpen(false);
      },
      // ::backdrop presses target the dialog itself; the panel covers everything else.
      onPointerDown: (event: PointerEvent) => {
        pressedBackdrop.current = event.target === event.currentTarget;
      },
      onClick: (event: MouseEvent) => {
        if (
          modal &&
          dismissible &&
          pressedBackdrop.current &&
          event.target === event.currentTarget
        )
          setOpen(false);
      },
    });

    return (
      <>
        {trigger &&
          cloneTrigger(trigger, {
            "aria-haspopup": "dialog",
            "aria-expanded": open,
            "aria-controls": id,
            onClick: (event: MouseEvent<HTMLElement>) => {
              // Safari doesn't focus a button on click, and the dialog restores focus to what had it.
              event.currentTarget.focus();
              setOpen(true);
            },
          })}
        <dialog
          {...props}
          {...handlers}
          ref={ref}
          id={id}
          className={["prava-dialog", className].filter(Boolean).join(" ")}
          data-size={size}
          data-modal={modal ? "" : undefined}
          aria-labelledby={props["aria-labelledby"] ?? `${id}-title`}
          aria-describedby={
            props["aria-describedby"] ??
            (description != null ? `${id}-description` : undefined)
          }
        >
          {mounted && (
            <CloseContext.Provider value={() => setOpen(false)}>
              <div className="prava-dialog__panel">
                <header
                  className={["prava-dialog__header", classNames?.header]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <h2
                    id={`${id}-title`}
                    className={["prava-dialog__title", classNames?.title]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {title}
                  </h2>
                  {description != null && (
                    <p
                      id={`${id}-description`}
                      className={[
                        "prava-dialog__description",
                        classNames?.description,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {description}
                    </p>
                  )}
                </header>
                {children != null && (
                  <div
                    className={["prava-dialog__body", classNames?.body]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {children}
                  </div>
                )}
                {footer != null && (
                  <footer
                    className={["prava-dialog__footer", classNames?.footer]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {footer}
                  </footer>
                )}
                {/* Last in the DOM so it doesn't take initial focus from the content. */}
                {!hideClose && (
                  <button
                    type="button"
                    className={["prava-dialog__close", classNames?.close]
                      .filter(Boolean)
                      .join(" ")}
                    aria-label={messages.close}
                    onClick={() => setOpen(false)}
                  >
                    <svg viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M4 4l8 8M12 4l-8 8" />
                    </svg>
                  </button>
                )}
              </div>
            </CloseContext.Provider>
          )}
        </dialog>
      </>
    );
  },
);
