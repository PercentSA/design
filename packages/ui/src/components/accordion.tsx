"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { Accordion as RadixAccordion } from "radix-ui";
import { cn } from "../lib/cn";

export type AccordionItem = { value: string; title: ReactNode; content: ReactNode; disabled?: boolean };

type Single = { type?: "single"; value?: string; defaultValue?: string; onValueChange?: (value: string) => void; collapsible?: boolean };
type Multiple = { type: "multiple"; value?: string[]; defaultValue?: string[]; onValueChange?: (value: string[]) => void };

/**
 * Sections that open and close (FAQ, settings groups). `type="single"` (default) keeps one open
 * and can close it; `type="multiple"` opens several. Keyboard: Up/Down/Home/End between headers.
 * Closed panels stay in the HTML, hidden (search engines see them); in the browser they are
 * hidden="until-found", so find-in-page opens the item with the match (not a disabled one).
 */
export function Accordion({ items, className, ...root }: { items: AccordionItem[]; className?: string } & (Single | Multiple)) {
  // The panels stay mounted (Radix unmounts closed ones), so the open items are kept here.
  const [own, setOwn] = useState(root.defaultValue);
  const multiple = root.type === "multiple";
  const value = root.value ?? own ?? (multiple ? [] : "");
  const open = [value].flat();
  const change = (next: string & string[]) => {
    setOwn(next);
    root.onValueChange?.(next);
  };
  const props = root.type === "multiple" ? root : { collapsible: true, ...root, type: "single" as const };
  return (
    <RadixAccordion.Root {...props} value={value as string & string[]} onValueChange={change} className={cn("border-t border-line", className)}>
      {items.map((item) => (
        <RadixAccordion.Item key={item.value} value={item.value} disabled={item.disabled} className="border-b border-line">
          <RadixAccordion.Header>
            <RadixAccordion.Trigger className="group flex w-full items-center justify-between gap-4 py-4 text-start text-sm font-medium text-fg transition-colors hover:text-fg-2 disabled:pointer-events-none disabled:opacity-50">
              {item.title}
              <ChevronDown
                aria-hidden
                className="size-4 shrink-0 text-fg-3 transition-transform duration-(--p-duration-fast) group-data-[state=open]:rotate-180 motion-reduce:transition-none"
              />
            </RadixAccordion.Trigger>
          </RadixAccordion.Header>
          <Panel
            open={open.includes(item.value)}
            disabled={item.disabled}
            onReveal={() => change((multiple ? [...open, item.value] : item.value) as string & string[])}
          >
            {item.content}
          </Panel>
        </RadixAccordion.Item>
      ))}
    </RadixAccordion.Root>
  );
}

function Panel({ open, disabled, onReveal, children }: { open: boolean; disabled?: boolean; onReveal: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  // React 19.3 writes `hidden` only as hidden="" and has no onBeforeMatch, so the browser side is set here.
  useLayoutEffect(() => {
    const el = ref.current!;
    if (open) return;
    // Plain hidden when find-in-page cannot open it (disabled, or a browser without beforematch).
    if (disabled || !("onbeforematch" in el)) return void el.setAttribute("hidden", "");
    el.setAttribute("hidden", "until-found");
    el.addEventListener("beforematch", onReveal);
    return () => el.removeEventListener("beforematch", onReveal);
  });
  return (
    <RadixAccordion.Content ref={ref} forceMount hidden={!open} className="p-accordion overflow-hidden text-sm text-fg-2">
      <div className="pb-4">{children}</div>
    </RadixAccordion.Content>
  );
}
