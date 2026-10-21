import { Fragment, type ReactNode } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Tabs as RadixTabs } from "radix-ui";
import { cn } from "../lib/cn";
import { useSlidingIndicator } from "../lib/sliding-indicator";
import { useLinkComponent, useStrings, useText } from "../provider";

/** First link of the page: jumps over the header for keyboard users. Give the main element id="main". */
export function SkipLink({ href = "#main" }: { href?: string }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-(--p-z-cursor) focus:rounded-pill focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-fg"
    >
      {useText()(useStrings().skipToContent)}
    </a>
  );
}

export type TabItem = { value: string; label: ReactNode; content: ReactNode; disabled?: boolean };

export function Tabs({
  items,
  className,
  ...props
}: { items: TabItem[]; value?: string; defaultValue?: string; onValueChange?: (value: string) => void; className?: string; "aria-label"?: string }) {
  const { "aria-label": label, ...root } = props;
  // After the first measure one underline slides between the tabs; before it, the active tab draws its own.
  const [listRef, line] = useSlidingIndicator<HTMLDivElement>("data-state", "active");
  return (
    <RadixTabs.Root className={cn("grid gap-6", className)} {...root}>
      {/* The line is an inset shadow, so the active tab's border covers it without reaching outside the scrolling list. */}
      <RadixTabs.List ref={listRef} aria-label={label} className="relative isolate flex gap-6 overflow-x-auto shadow-[inset_0_-1px_0_var(--p-line)]">
        {line && <span {...line} className={cn(line.className, "border-b-2 border-primary")} />}
        {items.map((t) => (
          <RadixTabs.Trigger
            key={t.value}
            value={t.value}
            disabled={t.disabled}
            className={cn(
              "border-b-2 border-transparent pb-3 text-sm font-medium whitespace-nowrap text-fg-3 transition-colors hover:text-fg-2 disabled:opacity-50 data-[state=active]:text-fg",
              !line && "data-[state=active]:border-primary",
            )}
          >
            {t.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {items.map((t) => (
        <RadixTabs.Content key={t.value} value={t.value}>
          {t.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}

const Chevron = ({ back }: { back?: boolean }) =>
  back ? <ChevronLeft aria-hidden className="size-4 rtl:-scale-x-100" /> : <ChevronRight aria-hidden className="size-4 rtl:-scale-x-100" />;

export type Crumb = { href?: string; label: ReactNode };

/** Where the page sits. The last item is the current page and is not a link. */
export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  const s = useStrings();
  const L = useLinkComponent();
  return (
    <nav aria-label={s.breadcrumb} className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-fg-3">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1.5">
              {last || !c.href ? (
                <span aria-current={last ? "page" : undefined} className={cn(last && "text-fg")}>
                  {c.label}
                </span>
              ) : (
                <L href={c.href} className="transition-colors hover:text-fg">
                  {c.label}
                </L>
              )}
              {!last && <Chevron />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Pages to show: always the first and last, the current one with `siblings` on each side; a gap hides at least 2 pages. */
export function paginationRange(page: number, total: number, siblings = 1): (number | "gap")[] {
  const slots = siblings * 2 + 5;
  const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  if (total <= slots) return range(1, total);
  const left = page - siblings;
  const right = page + siblings;
  if (left <= 3) return [...range(1, slots - 2), "gap", total];
  if (right >= total - 2) return [1, "gap", ...range(total - slots + 3, total)];
  return [1, "gap", ...range(left, right), "gap", total];
}

const PAGE = "grid h-9 min-w-9 place-items-center rounded-pill px-2 text-sm tabular-nums transition-colors";

/**
 * Page links. With `href` they are real links (work without JavaScript); with `onPageChange` buttons.
 */
export function Pagination({
  page,
  total,
  href,
  onPageChange,
  className,
}: {
  page: number;
  total: number;
  href?: (page: number) => string;
  onPageChange?: (page: number) => void;
  className?: string;
}) {
  const s = useStrings();
  const L = useLinkComponent();
  const item = (n: number, children: ReactNode, label: string, extra?: string) => {
    const props = { "aria-label": label, className: cn(PAGE, "text-fg-2 hover:bg-surface-2 hover:text-fg", extra) };
    return href ? (
      <L href={href(n)} {...props}>
        {children}
      </L>
    ) : (
      <button type="button" onClick={() => onPageChange?.(n)} {...props}>
        {children}
      </button>
    );
  };
  const edge = (to: number, back: boolean) =>
    to < 1 || to > total ? (
      <span aria-disabled="true" className={cn(PAGE, "text-fg-3 opacity-50")}>
        <Chevron back={back} />
        <span className="sr-only">{back ? s.previous : s.next}</span>
      </span>
    ) : (
      item(to, <Chevron back={back} />, back ? s.previous : s.next)
    );
  return (
    <nav aria-label={s.pagination} className={className}>
      <ul className="flex items-center gap-1">
        <li>{edge(page - 1, true)}</li>
        {paginationRange(page, total).map((n, i) => (
          <li key={i}>
            {n === "gap" ? (
              <span aria-hidden="true" className={cn(PAGE, "text-fg-3")}>
                …
              </span>
            ) : n === page ? (
              <span aria-current="page" className={cn(PAGE, "bg-primary font-medium text-primary-fg")}>
                {n}
              </span>
            ) : (
              item(n, n, s.goToPage(n))
            )}
          </li>
        ))}
        <li>{edge(page + 1, false)}</li>
      </ul>
    </nav>
  );
}

export type StepItem = { label: ReactNode; description?: ReactNode };

/** Progress through a flow (checkout, onboarding). `current` is the 0-based index. */
export function Steps({ items, current, className }: { items: StepItem[]; current: number; className?: string }) {
  const s = useStrings();
  return (
    <ol className={cn("flex flex-wrap items-start gap-x-4 gap-y-3", className)}>
      {items.map((step, i) => {
        const state = i < current ? "done" : i === current ? "current" : "next";
        return (
          <Fragment key={i}>
            {i > 0 && <li aria-hidden="true" className={cn("mt-3.5 h-px min-w-6 flex-1", i <= current ? "bg-primary" : "bg-line-strong")} />}
            <li aria-current={state === "current" ? "step" : undefined} className="flex items-start gap-3">
              <span
                className={cn(
                  "grid size-7 shrink-0 place-items-center rounded-pill border text-xs font-medium tabular-nums",
                  state === "done" && "border-primary bg-primary text-primary-fg",
                  state === "current" && "border-primary text-fg",
                  state === "next" && "border-line-strong text-fg-3",
                )}
              >
                {state === "done" ? <Check aria-hidden className="size-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <span className="grid gap-0.5 pt-0.5">
                <span className={cn("text-sm font-medium", state === "next" ? "text-fg-3" : "text-fg")}>{step.label}</span>
                {step.description && <span className="text-xs text-fg-3">{step.description}</span>}
                {state === "current" && <span className="sr-only">{s.step(i + 1, items.length)}</span>}
              </span>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
