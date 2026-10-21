import { useEffect, useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { cn } from "../lib/cn";
import { useStrings } from "../provider";
import { buttonClass } from "./actions";
import { SkipLink } from "./navigation";
import { Sheet } from "./overlays";
import { SidebarInSheet } from "./sidebar";
import { VisuallyHidden } from "./utility";

/**
 * App layout: the `sidebar` on the start side from 1024 px (by CSS, so it shows without JavaScript),
 * in a sheet below; a sticky header row; `children` in <main id={mainId}> (default "main", the skip link's target).
 * Compact controls unless `density="comfortable"`. `embedded`: inside a page that has its own <main> and skip
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
  sidebar: ReactNode;
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
  // An open modal sheet on a wide screen would leave the page inert while its button is hidden.
  useEffect(() => {
    const wide = matchMedia("(min-width: 1024px)");
    const onChange = () => wide.matches && setOpen(false);
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, []);
  return (
    <div
      data-density={density === "compact" ? "compact" : undefined}
      className={cn("min-h-dvh bg-bg text-fg lg:grid lg:grid-cols-[auto_minmax(0,1fr)] lg:grid-rows-[auto_1fr]", className)}
    >
      {!embedded && <SkipLink href={`#${mainId}`} />}
      <div className="hidden lg:row-span-2 lg:block">
        {/* h-full, not h-dvh: the sidebar then adds only its content height to the grid, so a shell in a smaller box keeps that size. */}
        <div className="sticky top-0 h-full max-h-dvh">{sidebar}</div>
      </div>
      <Header
        className={cn(
          "sticky top-0 z-(--p-z-sticky) flex h-14 items-center gap-3 border-b border-line bg-bg/90 px-4 backdrop-blur-md lg:col-start-2 lg:px-6",
          !header && "lg:hidden",
        )}
      >
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
        {header && <div className="flex min-w-0 flex-1 items-center gap-3">{header}</div>}
      </Header>
      <Main id={mainId} className="min-w-0 lg:col-start-2 lg:row-start-2">
        {children}
      </Main>
    </div>
  );
}
