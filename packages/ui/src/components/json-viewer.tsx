import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../lib/cn";
import { useStrings } from "../provider";

/** JSON-like data as a tree. Objects and arrays below the first `defaultDepth` levels start collapsed. Always left to right. */
export function JsonViewer({ value, defaultDepth = 1, className }: { value: unknown; defaultDepth?: number; className?: string }) {
  return (
    <div dir="ltr" className={cn("text-start font-mono text-[13px] leading-6 text-fg-2", className)}>
      <JsonNode value={value} depth={0} defaultDepth={defaultDepth} ancestors={[]} />
    </div>
  );
}

// Chevron (14px) + gap (4px): rows without a chevron start here so keys line up.
const INDENT = "ps-[18px]";

function JsonNode({ name, value, depth, defaultDepth, ancestors }: { name?: string; value: unknown; depth: number; defaultDepth: number; ancestors: object[] }) {
  const s = useStrings();
  const [open, setOpen] = useState(depth < defaultDepth);
  const key = name !== undefined && <span>{name}: </span>;
  const circular = typeof value === "object" && value !== null && ancestors.includes(value);
  // Object.entries sees no own fields on these: show them as JSON-like values instead of {}.
  const shown =
    value instanceof Date
      ? isNaN(value.getTime())
        ? "Invalid Date"
        : value.toISOString()
      : value instanceof Map
        ? Object.fromEntries(value)
        : value instanceof Set
          ? [...value]
          : value;
  const entries = typeof shown === "object" && shown !== null && !circular ? Object.entries(shown) : [];

  if (!entries.length) {
    return (
      <div className={cn(depth > 0 && INDENT)}>
        {key}
        <Leaf value={shown} circular={circular} />
      </div>
    );
  }

  const [start, end] = Array.isArray(shown) ? ["[", "]"] : ["{", "}"];
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-label={name === undefined ? (open ? s.collapse : s.expand) : `${open ? s.collapse : s.expand} ${name}`}
        onClick={() => setOpen(!open)}
        className="inline-flex h-6 items-center gap-1 rounded-sm text-start hover:text-fg"
      >
        <ChevronRight aria-hidden className={cn("size-3.5 shrink-0 text-fg-3 transition-transform duration-(--p-duration-fast) motion-reduce:transition-none", open && "rotate-90")} />
        {key}
        <span className="text-fg-3">{start}</span>
      </button>
      {open ? (
        <>
          <ul className="ms-[7px] border-s border-line ps-[10px]">
            {entries.map(([k, v]) => (
              <li key={k}>
                <JsonNode name={k} value={v} depth={depth + 1} defaultDepth={defaultDepth} ancestors={[...ancestors, value as object]} />
              </li>
            ))}
          </ul>
          <div className={cn(INDENT, "text-fg-3")}>{end}</div>
        </>
      ) : (
        <span className="text-fg-3">
          {` … ${end} `}
          <span className="font-sans text-xs">{s.itemCount(entries.length)}</span>
        </span>
      )}
    </div>
  );
}

function Leaf({ value, circular }: { value: unknown; circular: boolean }) {
  if (circular) return <span className="text-fg-3">[Circular]</span>;
  if (typeof value === "string") return <span className="text-fg wrap-anywhere">{JSON.stringify(value)}</span>;
  if (value === null || value === undefined) return <span className="text-fg-3">{String(value)}</span>;
  if (typeof value === "object") return <span className="text-fg-3">{Array.isArray(value) ? "[]" : "{}"}</span>;
  return <span className="text-fg">{String(value)}</span>;
}
