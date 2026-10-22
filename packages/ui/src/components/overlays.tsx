"use client";

import { useCallback, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { X } from "lucide-react";
import { AlertDialog as RadixAlert, Dialog as RadixDialog, HoverCard as RadixHoverCard, Popover as RadixPopover, Tooltip as RadixTooltip } from "radix-ui";
import { cn } from "../lib/cn";
import { useDir, useStrings } from "../provider";
import { Button } from "./actions";
import { buttonClass } from "./button-class";

type OpenState = { open?: boolean; defaultOpen?: boolean; onOpenChange?: (open: boolean) => void };

const BACKDROP = "p-overlay fixed inset-0 z-(--p-z-overlay) bg-bg/70 backdrop-blur-sm";
const PANEL = "border border-line bg-surface-2 text-fg shadow-overlay";
const FLOAT = cn("p-float z-(--p-z-overlay) rounded-field p-4 text-sm", PANEL);
const CLOSE = "absolute end-4 top-4 grid size-9 place-items-center rounded-pill text-fg-3 transition-colors hover:bg-surface hover:text-fg [&_svg]:size-4";
const WIDTH = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" } as const;

function DialogHead({ title, description, Title, Description }: { title: ReactNode; description?: ReactNode; Title: typeof RadixDialog.Title; Description: typeof RadixDialog.Description }) {
  return (
    <div className="grid gap-2 pe-10">
      <Title className="heading text-xl">{title}</Title>
      {description && <Description className="text-sm text-fg-2">{description}</Description>}
    </div>
  );
}

/** A modal window. `title` is required: screen readers announce it when the dialog opens. */
export function Dialog({
  trigger,
  title,
  description,
  footer,
  size = "md",
  children,
  className,
  ...state
}: OpenState & { trigger?: ReactNode; title: ReactNode; description?: ReactNode; footer?: ReactNode; size?: keyof typeof WIDTH; children?: ReactNode; className?: string }) {
  const s = useStrings();
  return (
    <RadixDialog.Root {...state}>
      {trigger && <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={BACKDROP} />
        <RadixDialog.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn(
            "p-pop fixed start-1/2 top-1/2 z-(--p-z-overlay) grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] -translate-y-1/2 gap-6 overflow-auto rounded-panel p-6 md:p-8 ltr:-translate-x-1/2 rtl:translate-x-1/2",
            PANEL,
            WIDTH[size],
            className,
          )}
        >
          <DialogHead title={title} description={description} Title={RadixDialog.Title} Description={RadixDialog.Description} />
          {children}
          {footer && <div className="flex flex-wrap justify-end gap-2">{footer}</div>}
          <RadixDialog.Close className={CLOSE} aria-label={s.close}>
            <X aria-hidden />
          </RadixDialog.Close>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

export const DialogClose = RadixDialog.Close;

/**
 * Asks before something that cannot be undone. Focus starts on Cancel.
 * If `onAction` returns a Promise, the dialog stays open with a loading action until it resolves; on reject it stays open.
 */
export function AlertDialog({
  trigger,
  title,
  description,
  action,
  cancel,
  destructive,
  onAction,
  open,
  defaultOpen,
  onOpenChange,
}: OpenState & {
  trigger?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action: ReactNode;
  cancel?: ReactNode;
  destructive?: boolean;
  /** Return a Promise to keep the dialog open until it resolves. Typed `unknown` so callbacks that return a value still fit. */
  onAction: () => unknown;
}) {
  const s = useStrings();
  const [inner, setInner] = useState(defaultOpen ?? false);
  const [pending, setPending] = useState(false);
  // Without a trigger (opened from a menu or a sheet), focus goes back to where it was, not to the page.
  const back = useRef<Element | null>(null);
  const setOpen = (o: boolean) => {
    if (open === undefined) setInner(o);
    onOpenChange?.(o);
  };
  // Button ignores clicks while loading, so a second click cannot run the action again.
  const run = (e: MouseEvent) => {
    const result = onAction();
    if (!(result instanceof Promise)) return;
    e.preventDefault(); // keeps Radix from closing now
    setPending(true);
    result.then(
      () => {
        setPending(false);
        setOpen(false);
      },
      () => setPending(false),
    );
  };
  // While the action runs, Escape and Cancel do nothing: a late result must not close a dialog opened again.
  return (
    <RadixAlert.Root open={open ?? inner} onOpenChange={(o) => (pending && !o) || setOpen(o)}>
      {trigger && <RadixAlert.Trigger asChild>{trigger}</RadixAlert.Trigger>}
      <RadixAlert.Portal>
        <RadixAlert.Overlay className={BACKDROP} />
        <RadixAlert.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          onOpenAutoFocus={() => (back.current = document.activeElement)}
          onCloseAutoFocus={(e) => {
            if (trigger || !(back.current instanceof HTMLElement) || !back.current.isConnected) return;
            e.preventDefault();
            back.current.focus();
          }}
          className={cn(
            "p-pop fixed start-1/2 top-1/2 z-(--p-z-overlay) grid w-[calc(100%-2rem)] max-w-md -translate-y-1/2 gap-6 rounded-panel p-6 md:p-8 ltr:-translate-x-1/2 rtl:translate-x-1/2",
            PANEL,
          )}
        >
          <DialogHead title={title} description={description} Title={RadixAlert.Title} Description={RadixAlert.Description} />
          <div className="flex flex-wrap justify-end gap-2">
            <RadixAlert.Cancel disabled={pending} className={buttonClass("secondary")}>{cancel ?? s.cancel}</RadixAlert.Cancel>
            <RadixAlert.Action asChild onClick={run}>
              <Button variant={destructive ? "danger" : "primary"} loading={pending}>
                {action}
              </Button>
            </RadixAlert.Action>
          </div>
        </RadixAlert.Content>
      </RadixAlert.Portal>
    </RadixAlert.Root>
  );
}

// Side sheets leave only vertical panning (scroll, zoom) to the browser, so a horizontal drag reaches the sheet.
const SIDE = {
  end: "inset-y-0 end-0 h-dvh w-[min(100%,28rem)] border-s touch-pan-y touch-pinch-zoom",
  start: "inset-y-0 start-0 h-dvh w-[min(100%,28rem)] border-e touch-pan-y touch-pinch-zoom",
  bottom: "inset-x-0 bottom-0 max-h-[85dvh] rounded-t-panel border-t",
} as const;

type Drag = { id: number; x: number; y: number; grab: boolean; on?: boolean; d: number; t: number; v: number };

// These use the pointer themselves, so a press on them never drags the sheet.
const NO_DRAG = "[role=slider], input, textarea, select, [contenteditable], [data-sheet-no-drag]";

/** True when a press must not drag: a handler already took it, it comes from a portaled child (React bubbles its
    events to the sheet), it is inside a NO_DRAG part, or (side sheets) inside a horizontal scroller (carousel, table). */
function keepsPointer(e: PointerEvent<HTMLDivElement>, side: keyof typeof SIDE) {
  const el = e.currentTarget;
  const t = e.target as Element;
  if (e.defaultPrevented || !el.contains(t) || t.closest(NO_DRAG)) return true;
  if (side !== "bottom")
    for (let n: Element | null = t; n && n !== el; n = n.parentElement)
      if (n.scrollWidth > n.clientWidth && /auto|scroll/.test(getComputedStyle(n).overflowX)) return true;
  return false;
}

/** Touch and pen drag toward the closing side (docs/motion-2.md part 7). The sheet follows the finger; on release,
    past 30 % of its size or a flick (> 0.5 px/ms) clicks the Radix close button (focus return, onOpenChange),
    else the CSS transition springs it back. A mouse never drags. */
function useSheetDrag(side: keyof typeof SIDE) {
  const rtl = useDir() === "rtl";
  const close = useRef<HTMLButtonElement>(null);
  const drag = useRef<Drag | null>(null);
  // +1: closes toward right/down. "end" is right in LTR, left in RTL.
  const sign = side === "bottom" || (side === "end") !== rtl ? 1 : -1;

  // React listens to touchmove passively; only a native listener can stop the browser from scrolling during a drag.
  // Stable, so its cleanup runs only when the content unmounts (closed mid-drag): then no drag is left behind.
  const ref = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const stop = (e: TouchEvent) => {
      if (drag.current?.on) e.preventDefault();
    };
    el.addEventListener("touchmove", stop, { passive: false });
    return () => {
      el.removeEventListener("touchmove", stop);
      drag.current = null;
    };
  }, []);
  // A press replaces any drag that has not started (its release can get lost); a second finger never takes over a drag.
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" || e.button !== 0 || drag.current?.on) return;
    drag.current = keepsPointer(e, side)
      ? null
      : { id: e.pointerId, x: e.clientX, y: e.clientY, grab: !!(e.target as Element).closest("[data-sheet-grab]"), d: 0, t: e.timeStamp, v: 0 };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const g = drag.current;
    const el = e.currentTarget;
    if (!g || g.id !== e.pointerId || g.on === false) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (g.on === undefined) {
      if (Math.hypot(dx, dy) < 8) return;
      // Bottom: the handle and header always drag; the content only when scrolled to the top and pulled down.
      g.on = side === "bottom" ? Math.abs(dy) > Math.abs(dx) && (g.grab || (el.scrollTop <= 0 && dy > 0)) : Math.abs(dx) > Math.abs(dy);
      if (!g.on) return;
      el.setAttribute("data-dragging", "");
      // Release and cancel now always reach the sheet; losing the capture ends the drag (onLostPointerCapture).
      el.setPointerCapture(e.pointerId);
    }
    const d = Math.max(0, (side === "bottom" ? dy : dx) * sign);
    g.v = (d - g.d) / Math.max(1, e.timeStamp - g.t);
    g.d = d;
    g.t = e.timeStamp;
    el.style.translate = side === "bottom" ? `0 ${d}px` : `${d * sign}px 0`;
  };
  const end = (e: PointerEvent<HTMLDivElement>) => {
    const g = drag.current;
    const el = e.currentTarget;
    if (!g || g.id !== e.pointerId) return;
    drag.current = null;
    if (!g.on) return;
    el.removeAttribute("data-dragging");
    const size = side === "bottom" ? el.offsetHeight : el.offsetWidth;
    const flick = e.timeStamp - g.t < 100 && g.v > 0.5;
    // Closing keeps the dragged offset: the exit animation starts from it.
    if (e.type === "pointerup" && (g.d > size * 0.3 || flick)) {
      close.current?.click();
      // A controlled sheet can stay open (an unsaved-changes confirm): then spring back.
      requestAnimationFrame(() => {
        if (el.getAttribute("data-state") === "open") el.style.translate = "";
      });
    } else el.style.translate = "";
  };
  // Children lose their implicit touch capture when the sheet takes it: only the sheet's own loss ends the drag.
  const onLostPointerCapture = (e: PointerEvent<HTMLDivElement>) => e.target === e.currentTarget && end(e);
  return { close, content: { ref, onPointerDown, onPointerMove, onPointerUp: end, onPointerCancel: end, onLostPointerCapture } };
}

/** A panel that slides in from a side (filters, details, phone menus). `end` is right in English, left in Arabic.
    On touch it closes with a drag toward its side (bottom sheets: from the handle and header, or the content when scrolled to the top).
    Put `data-sheet-no-drag` on a part with its own drag (a map, a signature pad). */
export function Sheet({
  trigger,
  title,
  description,
  side = "end",
  children,
  className,
  ...state
}: OpenState & { trigger?: ReactNode; title: ReactNode; description?: ReactNode; side?: keyof typeof SIDE; children?: ReactNode; className?: string }) {
  const s = useStrings();
  const drag = useSheetDrag(side);
  const head = <DialogHead title={title} description={description} Title={RadixDialog.Title} Description={RadixDialog.Description} />;
  return (
    <RadixDialog.Root {...state}>
      {trigger && <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>}
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={BACKDROP} />
        <RadixDialog.Content
          data-side={side}
          {...drag.content}
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn("p-sheet fixed z-(--p-z-overlay) flex flex-col gap-6 overflow-auto border-line bg-surface-2 p-6 text-fg shadow-overlay", SIDE[side], className)}
        >
          {side === "bottom" ? (
            // The browser never pans here, so a drag on the handle or header always reaches the sheet.
            <div data-sheet-grab className="-mt-3 grid touch-pinch-zoom gap-3">
              <div data-sheet-handle aria-hidden="true" className="mx-auto h-1 w-10 rounded-pill bg-fg-3" />
              {head}
            </div>
          ) : (
            head
          )}
          {children}
          <RadixDialog.Close ref={drag.close} className={CLOSE} aria-label={s.close}>
            <X aria-hidden />
          </RadixDialog.Close>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}

/** `start`/`end` follow the reading direction (start = left in English, right in Arabic); `left`/`right` stay physical. */
type Placement = { side?: "top" | "right" | "bottom" | "left" | "start" | "end"; align?: "start" | "center" | "end" };

function usePhysicalSide(side: Placement["side"]) {
  const rtl = useDir() === "rtl";
  return side === "start" ? (rtl ? "right" : "left") : side === "end" ? (rtl ? "left" : "right") : side;
}

export function Popover({ trigger, children, side, align = "start", className, ...state }: OpenState & Placement & { trigger: ReactNode; children: ReactNode; className?: string }) {
  const physical = usePhysicalSide(side);
  return (
    <RadixPopover.Root {...state}>
      <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content side={physical} align={align} sideOffset={8} collisionPadding={16} className={cn(FLOAT, "w-72", className)}>
          {children}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}

/** Extra detail on hover for mouse users. Never put the only copy of information here. */
export function HoverCard({ trigger, children, side, align, className, ...state }: OpenState & Placement & { trigger: ReactNode; children: ReactNode; className?: string }) {
  const physical = usePhysicalSide(side);
  return (
    <RadixHoverCard.Root openDelay={300} {...state}>
      <RadixHoverCard.Trigger asChild>{trigger}</RadixHoverCard.Trigger>
      <RadixHoverCard.Portal>
        <RadixHoverCard.Content side={physical} align={align} sideOffset={8} collisionPadding={16} className={cn(FLOAT, "w-80 rounded-card p-5", className)}>
          {children}
        </RadixHoverCard.Content>
      </RadixHoverCard.Portal>
    </RadixHoverCard.Root>
  );
}

/** A short label for an icon button. Works without <PercentProvider>. */
export function Tooltip({ content, children, side = "top", ...state }: OpenState & { content: ReactNode; children: ReactNode; side?: Placement["side"] }) {
  const physical = usePhysicalSide(side);
  return (
    <RadixTooltip.Provider delayDuration={300}>
      <RadixTooltip.Root {...state}>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content side={physical} sideOffset={6} className="p-float z-(--p-z-overlay) rounded-lg bg-fg px-2.5 py-1.5 text-xs font-medium text-bg">
            {content}
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
