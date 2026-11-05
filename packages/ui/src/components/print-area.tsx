"use client";

import { useCallback, useRef, useState, useSyncExternalStore, type ReactNode, type Ref } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";
import { PRINT_PAPER } from "./print-paper";

const subscribe = () => () => {};

/**
 * The part of a page that `usePrint` prints, on A4 paper (black on white in every theme). Hidden on screen.
 * After mount it renders at the end of <body>, so the print CSS can hide everything else (the page, an open sheet,
 * toasts). `header` repeats at the top of every printed page. On the server it renders nothing.
 */
export function PrintArea({
  ref,
  header,
  orientation = "portrait",
  className,
  children,
}: {
  ref?: Ref<HTMLDivElement>;
  header?: ReactNode;
  orientation?: "portrait" | "landscape";
  className?: string;
  children: ReactNode;
}) {
  const client = useSyncExternalStore(subscribe, () => true, () => false);
  if (!client) return null;
  return createPortal(
    <div ref={ref} data-print-area="" data-orientation={orientation} className={cn("hidden", PRINT_PAPER, className)}>
      {/* A table, because the browser repeats a <thead> on every printed page. */}
      <table role="presentation" className="w-full">
        {header && (
          <thead>
            <tr>
              <td className="pb-4">{header}</td>
            </tr>
          </thead>
        )}
        <tbody>
          <tr>
            <td>{children}</td>
          </tr>
        </tbody>
      </table>
    </div>,
    document.body,
  );
}

/**
 * `print(area)` prints one PrintArea: it marks the page, adds the A4 page rule (page numbers at the bottom), waits a frame and
 * calls `window.print()`. The page is restored on `afterprint`, or at once when `window.print` throws (the promise then
 * rejects). A call while `printing` is ignored. Render the rows to print first (`flushSync` when they change just before).
 */
export function usePrint() {
  const [printing, setPrinting] = useState(false);
  const busy = useRef(false);
  const print = useCallback(async (area: HTMLElement | null) => {
    if (!area || busy.current) return;
    busy.current = true;
    setPrinting(true);
    const html = document.documentElement;
    const page = document.createElement("style");
    page.setAttribute("data-print-page", "");
    // ltr: "1 / 3" keeps its order on Arabic pages too.
    page.textContent = `@page { size: A4 ${area.dataset.orientation ?? "portrait"}; margin: 12mm; @bottom-center { content: counter(page) " / " counter(pages); direction: ltr } }`;
    const restore = () => {
      removeEventListener("afterprint", restore);
      html.removeAttribute("data-printing");
      area.removeAttribute("data-print-active");
      page.remove();
      busy.current = false;
      setPrinting(false);
    };
    html.setAttribute("data-printing", "");
    area.setAttribute("data-print-active", "");
    document.head.append(page);
    addEventListener("afterprint", restore);
    await new Promise((done) => requestAnimationFrame(done));
    try {
      window.print();
    } catch (error) {
      restore();
      throw error;
    }
  }, []);
  return { print, printing };
}
