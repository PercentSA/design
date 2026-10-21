import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { useStrings } from "../provider";
import { CopyButton } from "./actions";

/**
 * Code with line numbers, a file name or language label and copy. Always left to right.
 * No syntax highlighter: pass highlighted `children` (for example Shiki tokens rendered on the server, not a <pre>);
 * they replace the plain lines, so `lineNumbers` and `highlight` do not apply. Copy always copies `code`.
 */
export function CodeBlock({
  code,
  language,
  filename,
  lineNumbers = true,
  highlight,
  children,
  className,
}: {
  code: string;
  /** Label only. */
  language?: string;
  filename?: string;
  lineNumbers?: boolean;
  /** Line numbers (from 1) to mark. */
  highlight?: number[];
  children?: ReactNode;
  className?: string;
}) {
  const s = useStrings();
  const name = filename ?? language;
  const lines = code.replace(/\n$/, "").split("\n");
  const marked = new Set(highlight);
  return (
    <figure dir="ltr" className={cn("overflow-hidden rounded-card border border-line bg-surface text-start", className)}>
      <figcaption className="flex h-11 items-center justify-between gap-3 border-b border-line ps-4 pe-1.5">
        <span className="truncate font-mono text-xs text-fg-3">{name}</span>
        <CopyButton value={code} iconOnly />
      </figcaption>
      {/* Focusable so keyboard users can scroll long lines; the inset ring is not cut off by the rounded figure. */}
      <div role={name ? "region" : "group"} tabIndex={0} aria-label={name ?? s.code} className="overflow-x-auto rounded-b-card focus-visible:-outline-offset-2">
        <pre className="w-max min-w-full py-4 font-mono text-[13px] leading-6 text-fg">
          {children ? (
            <code className="block px-4">{children}</code>
          ) : (
            <code className="grid">
              {lines.map((line, i) => (
                <span
                  key={i}
                  data-line={i + 1}
                  data-highlighted={marked.has(i + 1) || undefined}
                  className={cn("min-h-lh border-s-2 ps-4 pe-6", marked.has(i + 1) ? "border-fg-3 bg-surface-2" : "border-transparent")}
                >
                  {lineNumbers && (
                    <span aria-hidden="true" className="me-4 inline-block text-end text-fg-3 select-none" style={{ width: `${String(lines.length).length}ch` }}>
                      {i + 1}
                    </span>
                  )}
                  {line}
                  {/* Inside the line, so a selected blank line still copies as a newline. */}
                  {i < lines.length - 1 && "\n"}
                </span>
              ))}
            </code>
          )}
        </pre>
      </div>
    </figure>
  );
}
