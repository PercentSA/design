import { useSyncExternalStore, type ReactNode } from "react";
import { VisuallyHidden as RadixVisuallyHidden } from "radix-ui";

export const VisuallyHidden = RadixVisuallyHidden.Root;

/** Announces changes to screen readers. `assertive` interrupts (errors); default waits (status). */
export const LiveRegion = ({ assertive, children }: { assertive?: boolean; children?: ReactNode }) => (
  <div role={assertive ? "alert" : "status"} aria-live={assertive ? "assertive" : "polite"} className="sr-only">
    {children}
  </div>
);

/** false on the server and in the first render after hydration of a server page. */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const m = matchMedia(query);
      m.addEventListener("change", onChange);
      return () => m.removeEventListener("change", onChange);
    },
    () => matchMedia(query).matches,
    () => false,
  );
}

export const useReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");
