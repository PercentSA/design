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

/**
 * A dialog without a trigger (opened from a menu or a sheet): focus goes back to where it was, not to the page.
 * Spread `onOpenAutoFocus` and `onCloseAutoFocus` on the Radix content. `onOpenAutoFocus` returns the event so a caller can add its own focus.
 */
export function useFocusReturn(hasTrigger = false) {
  const back = useRef<Element | null>(null);
  return {
    onOpenAutoFocus: () => void (back.current = document.activeElement),
    onCloseAutoFocus: (e: Event) => {
      if (hasTrigger || !(back.current instanceof HTMLElement) || !back.current.isConnected) return;
      e.preventDefault();
      back.current.focus();
    },
  };
}
