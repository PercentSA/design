import { useLayoutEffect, useSyncExternalStore, type ReactNode } from "react";
import { X } from "lucide-react";
import { Toast as RadixToast } from "radix-ui";
import { cn } from "../lib/cn";
import { useDir, useStrings } from "../provider";
import { buttonClass } from "./actions";

type ToastData = {
  id: number;
  title: ReactNode;
  description?: ReactNode;
  tone?: "default" | "success" | "danger";
  duration?: number;
  /** One button, for example "Undo". A click calls `onClick` and closes the toast. */
  action?: { label: string; onClick: () => void };
};

// A tiny store: toast() can be called from anywhere (event handlers, after a fetch).
let toasts: ToastData[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const EMPTY: ToastData[] = [];
// Mounted Toasters, counted in a layout effect: a toast() from any mount effect already sees the Toaster.
let toasters = 0;

/** Shows a short message in the <Toaster>. Returns the id. Without a mounted Toaster the toast is dropped. */
export function toast(t: Omit<ToastData, "id">) {
  const id = nextId++;
  // Not kept, or a Toaster mounted later would show a pile of old toasts.
  if (!toasters) return id;
  toasts = [...toasts, { ...t, id }];
  emit();
  return id;
}
export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

const DOT = { default: "", success: "bg-live", danger: "bg-danger" } as const;

/** Place once near the root of the app. Toasts appear at the bottom, on the end side. */
export function Toaster() {
  const s = useStrings();
  const rtl = useDir() === "rtl";
  useLayoutEffect(() => {
    toasters++;
    return () => void toasters--;
  }, []);
  const list = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => toasts,
    () => EMPTY,
  );
  return (
    <RadixToast.Provider label={s.notifications} swipeDirection={rtl ? "left" : "right"}>
      {list.map((t) => (
        <RadixToast.Root
          key={t.id}
          duration={t.duration ?? 5000}
          onOpenChange={(open) => !open && dismissToast(t.id)}
          className="p-toast relative grid gap-1 rounded-card border border-line bg-surface-2 p-4 pe-12 text-fg shadow-overlay"
        >
          <RadixToast.Title className="flex items-center gap-2 text-sm font-medium">
            {t.tone && t.tone !== "default" && <span aria-hidden="true" className={cn("size-2 rounded-pill", DOT[t.tone])} />}
            {t.title}
          </RadixToast.Title>
          {t.description && <RadixToast.Description className="text-sm text-fg-2">{t.description}</RadixToast.Description>}
          {t.action && (
            <RadixToast.Action altText={t.action.label} onClick={t.action.onClick} className={cn(buttonClass("secondary", "sm"), "mt-2 justify-self-start")}>
              {t.action.label}
            </RadixToast.Action>
          )}
          <RadixToast.Close aria-label={s.close} className="absolute end-3 top-3 grid size-8 place-items-center rounded-pill text-fg-3 hover:bg-surface hover:text-fg">
            <X aria-hidden className="size-4" />
          </RadixToast.Close>
        </RadixToast.Root>
      ))}
      <RadixToast.Viewport className="fixed end-0 bottom-0 z-(--p-z-toast) flex w-full max-w-sm flex-col gap-2 p-4 outline-none" />
    </RadixToast.Provider>
  );
}
