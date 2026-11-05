"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { cn } from "../lib/cn";
import { useStrings } from "../provider";
import { buttonClass } from "./button-class";
import { SkipLink } from "./navigation";
import { Sheet } from "./overlays";
import { SidebarInSheet } from "./sidebar";
import { VisuallyHidden } from "./utility";

// The bundler of the app replaces process.env.NODE_ENV; the package has no Node types.
declare const process: { env: { NODE_ENV?: string } } | undefined;

/**
 * App layout: the `sidebar` on the start side from 1024 px (by CSS, so it shows without JavaScript),
 * in a sheet below; a sticky header row. Without `sidebar` (a small tool with no navigation) there is no sidebar column,
 * no menu button and no sheet, and the header row shows at every width; `children` in <main id={mainId}> (default "main", the skip link's target).
 * Compact controls unless `density="comfortable"`. Sets `--p-sticky-top` (the header row's height) for a sticky PageHeader. `embedded`: inside a page that has its own <main> and skip
 * link (an app layout, a preview), the shell adds no landmarks (<div> for <header> and <main>) and no skip link.
 */
export function AppShell({
  sidebar,
  header,
  density = "compact",
  mainId = "main",
  embedded = false,
  className,
  children,
}: {
  sidebar?: ReactNode;
  header?: ReactNode;
  density?: "compact" | "comfortable";
  mainId?: string;
  embedded?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const s = useStrings();
  const [open, setOpen] = useState(false);
  const Header = embedded ? "div" : "header";
  const Main = embedded ? "div" : "main";
  const nav = sidebar != null && sidebar !== false;
  useEffect(() => {
    if (!nav && !header && typeof process !== "undefined" && process.env.NODE_ENV !== "production") console.warn("AppShell: no sidebar and no header, so only <main> shows.");
  }, [nav, header]);
  // An open modal sheet on a wide screen would leave the page inert while its button is hidden.
  useEffect(() => {
    if (!nav) return;
    const wide = matchMedia("(min-width: 1024px)");
    const onChange = () => wide.matches && setOpen(false);
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, [nav]);
  return (
    <div
      data-density={density === "compact" ? "compact" : undefined}
      className={cn(
        "min-h-dvh bg-bg text-fg",
        nav && "lg:grid lg:grid-cols-[auto_minmax(0,1fr)] lg:grid-rows-[auto_1fr]",
        // Where a sticky PageHeader stops: under the header row (h-14), or at the top where that row is hidden.
        "[--p-sticky-top:3.5rem]",
        !header && (nav ? "lg:[--p-sticky-top:0px]" : "[--p-sticky-top:0px]"),
        className,
      )}
    >
      {!embedded && <SkipLink href={`#${mainId}`} />}
      {nav && (
        <div className="hidden lg:row-span-2 lg:block">
          {/* h-full, not h-dvh: the sidebar then adds only its content height to the grid, so a shell in a smaller box keeps that size. */}
          <div className="sticky top-0 h-full max-h-dvh">{sidebar}</div>
        </div>
      )}
      {(nav || header) && (
      <Header
        className={cn(
          "sticky top-0 z-(--p-z-sticky) flex h-14 items-center gap-3 border-b border-line bg-bg/90 px-4 backdrop-blur-md lg:px-6",
          nav && "lg:col-start-2",
          nav && !header && "lg:hidden",
        )}
      >
        {nav && (
        <Sheet
          open={open}
          onOpenChange={setOpen}
          side="start"
          title={<VisuallyHidden>{s.menu}</VisuallyHidden>}
          className="w-[min(100%,18rem)] gap-0 p-0"
          trigger={
            <button type="button" aria-label={s.openNavigation} className={cn(buttonClass("ghost", "md", true), "-ms-2 lg:hidden")}>
              <Menu aria-hidden />
            </button>
          }
        >
          {/* Router links do not unmount the shell, so a chosen link closes the sheet. */}
          <div className="flex-1" onClick={(e) => (e.target as Element).closest("a") && setOpen(false)}>
            <SidebarInSheet.Provider value={true}>{sidebar}</SidebarInSheet.Provider>
          </div>
        </Sheet>
        )}
        {header && <div className="flex min-w-0 flex-1 items-center gap-3">{header}</div>}
      </Header>
      )}
      <Main id={mainId} className={cn("min-w-0", nav && "lg:col-start-2 lg:row-start-2")}>
        {children}
      </Main>
    </div>
  );
}
