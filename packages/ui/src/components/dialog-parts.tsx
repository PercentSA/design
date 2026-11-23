"use client";

import { useRef, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

/**
 * The line above a dialog's buttons that says why the action is refused. The status element stays in the page
 * (it is only `sr-only` when empty), so a reason that appears later is announced. `id` is for the action's `aria-describedby`.
 */
export function BlockedStatus({ id, children }: { id: string; children?: ReactNode }) {
  return (
    <div role="status" className="empty:sr-only">
      {children != null && children !== false && children !== "" && (
        <p id={id} className="flex items-start gap-2 text-sm text-fg-2">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>{children}</span>
        </p>
      )}
    </div>
  );
}

// What had the focus when a context menu opened, by menu id: Radix gives the focus back there when the menu closes.
const contextFocus = new Map<string, Element | null>();
export const rememberContextFocus = (id: string, el: Element | null) => void contextFocus.set(id, el);
export const forgetContextFocus = (id: string) => void contextFocus.delete(id);

/**
 * The focus target to return to: the focused element, or, when it is an item of a `DropdownMenu` (its trigger) or a `ContextMenu`
 * (the element that had the focus when the menu opened, else its area), the menu's target: the menu removes the item when it closes.
 */
export function returnTarget(el: Element | null) {
  const id = el?.closest("[data-p-menu][role=menu]")?.getAttribute("data-p-menu");
  if (!id) return el;
  const trigger = [...document.querySelectorAll("[data-p-menu]")].find((t) => t.getAttribute("data-p-menu") === id && t.getAttribute("role") !== "menu");
  const before = contextFocus.get(id);
  return (before && before !== document.body && before.isConnected ? before : trigger) ?? el;
}

/**
 * A dialog without a trigger (opened from a menu or a sheet): focus goes back to where it was, not to the page.
 * When it was opened from an item of a `DropdownMenu` or `ContextMenu`, focus goes back to that menu's trigger.
 * Spread `onOpenAutoFocus` and `onCloseAutoFocus` on the Radix content.
 */
export function useFocusReturn(hasTrigger = false) {
  const back = useRef<Element | null>(null);
  return {
    onOpenAutoFocus: () => void (back.current = returnTarget(document.activeElement)),
    onCloseAutoFocus: (e: Event) => {
      if (hasTrigger || !(back.current instanceof HTMLElement) || !back.current.isConnected) return;
      e.preventDefault();
      back.current.focus();
    },
  };
}
