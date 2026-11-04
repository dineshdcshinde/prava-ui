import { forwardRef } from "react";
import { Dialog, DialogClose } from "../dialog";
import type { DialogProps } from "../dialog";

export type DrawerProps = DialogProps & {
  /** Edge it slides from. `start` and `end` follow the text direction. */
  placement?: "start" | "end" | "top" | "bottom";
};

/** Makes its child close the surrounding Drawer when pressed. */
export const DrawerClose = DialogClose;

/**
 * A Dialog anchored to a screen edge, with the same props, focus, and dismissal rules.
 * @example
 * ```tsx
 * import { Drawer, DrawerClose } from 'prava-ui/drawer';
 *
 * <Drawer
 *   trigger={<Button>Filters</Button>}
 *   title="Filters"
 *   footer={<DrawerClose><Button>Apply</Button></DrawerClose>}
 * >
 *   Filter fields
 * </Drawer>
 * ```
 */
export const Drawer = forwardRef<HTMLDialogElement, DrawerProps>(
  function Drawer({ placement = "end", className, ...props }, ref) {
    return (
      <Dialog
        {...props}
        ref={ref}
        className={["prava-drawer", className].filter(Boolean).join(" ")}
        data-placement={placement}
      />
    );
  },
);
