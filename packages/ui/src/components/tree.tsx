import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "../lib/cn";
import { useDir } from "../provider";

/** A node of a Tree. `id` must be unique in the whole tree. */
export type TreeNode = { id: string; label: ReactNode; icon?: ReactNode; children?: TreeNode[] };

type Row = { id: string; parent?: number; isParent: boolean };

// The nodes on screen in document order, each with the index of its parent.
function visibleRows(nodes: TreeNode[], open: Set<string>, parent?: number, out: Row[] = []) {
  for (const node of nodes) {
    const at = out.length;
    const isParent = !!node.children?.length;
    out.push({ id: node.id, parent, isParent });
    if (isParent && open.has(node.id)) visibleRows(node.children!, open, at, out);
  }
  return out;
}

/**
 * A tree view (files, categories). Keyboard (WAI-ARIA tree pattern): Up/Down, Home/End, Right opens
 * or enters, Left closes or goes to the parent (mirrored in RTL), Enter/Space select. One tab stop.
 * A click selects a node and opens or closes it.
 */
export function Tree({
  items,
  expanded,
  defaultExpanded = [],
  onExpandedChange,
  selected,
  onSelect,
  className,
  "aria-label": label,
}: {
  items: TreeNode[];
  expanded?: string[];
  defaultExpanded?: string[];
  onExpandedChange?: (ids: string[]) => void;
  /** Controlled when given; `null`: nothing selected. */
  selected?: string | null;
  onSelect?: (id: string) => void;
  className?: string;
  "aria-label"?: string;
}) {
  const rtl = useDir() === "rtl";
  const base = useId();
  const tree = useRef<HTMLUListElement>(null);
  const [expandedInner, setExpandedInner] = useState(defaultExpanded);
  const [selectedInner, setSelectedInner] = useState<string>();
  const [focusId, setFocusId] = useState<string>();
  const open = expanded ?? expandedInner;
  const openSet = new Set(open);
  const sel = selected !== undefined ? selected : selectedInner;
  const rows = visibleRows(items, openSet);
  const tabId = rows.some((r) => r.id === focusId) ? focusId : (rows.find((r) => r.id === sel) ?? rows[0])?.id;

  const toggle = (id: string) => {
    const next = openSet.has(id) ? open.filter((x) => x !== id) : [...open, id];
    setExpandedInner(next);
    onExpandedChange?.(next);
  };
  const choose = (id: string) => {
    setSelectedInner(id);
    onSelect?.(id);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    const i = rows.findIndex((r) => r.id === (e.target as HTMLElement).dataset.id);
    const row = rows[i];
    if (!row) return;
    const isOpen = row.isParent && openSet.has(row.id);
    let to: number | undefined;
    switch (e.key) {
      case "ArrowDown":
        to = i + 1;
        break;
      case "ArrowUp":
        to = i - 1;
        break;
      case "Home":
        to = 0;
        break;
      case "End":
        to = rows.length - 1;
        break;
      case rtl ? "ArrowLeft" : "ArrowRight":
        if (isOpen) to = i + 1;
        else if (row.isParent) toggle(row.id);
        break;
      case rtl ? "ArrowRight" : "ArrowLeft":
        if (isOpen) toggle(row.id);
        else to = row.parent;
        break;
      case "Enter":
      case " ":
        choose(row.id);
        break;
      default:
        return;
    }
    e.preventDefault();
    // Treeitems are in document order, so the index in `rows` is the index in the DOM.
    if (to !== undefined) tree.current?.querySelectorAll<HTMLElement>('[role="treeitem"]')[to]?.focus();
  };

  const render = (nodes: TreeNode[], level: number, path: string): ReactNode =>
    nodes.map((node, i) => {
      const isParent = !!node.children?.length;
      const isOpen = isParent && openSet.has(node.id);
      const labelId = `${base}-${path}${i}`;
      return (
        <li
          key={node.id}
          role="treeitem"
          data-id={node.id}
          aria-level={level}
          aria-setsize={nodes.length}
          aria-posinset={i + 1}
          aria-expanded={isParent ? isOpen : undefined}
          aria-selected={node.id === sel || undefined}
          // Name from the label only, not from the child nodes inside this element.
          aria-labelledby={labelId}
          tabIndex={node.id === tabId ? 0 : -1}
          // The focus ring goes on the row, not around the whole subtree.
          className="focus-visible:[outline:none] [&:focus-visible>div]:[outline:2px_solid_var(--p-fg)] [&:focus-visible>div]:[outline-offset:-2px]"
        >
          <div
            onClick={() => {
              choose(node.id);
              if (isParent) toggle(node.id);
            }}
            style={{ paddingInlineStart: `${(level - 1) * 1.25 + 0.5}rem` }}
            className={cn(
              "flex min-h-8 cursor-default items-center gap-1.5 rounded-field pe-2 text-sm transition-colors select-none hover:bg-surface-2 hover:text-fg",
              node.id === sel ? "bg-surface-2 font-medium text-fg" : "text-fg-2",
            )}
          >
            {isParent ? (
              isOpen ? (
                <ChevronDown aria-hidden className="size-4 shrink-0 text-fg-3" />
              ) : (
                <ChevronRight aria-hidden className="size-4 shrink-0 text-fg-3 rtl:-scale-x-100" />
              )
            ) : (
              <span className="size-4 shrink-0" />
            )}
            {node.icon && (
              <span aria-hidden="true" className="shrink-0 text-fg-3 [&_svg]:size-4">
                {node.icon}
              </span>
            )}
            <span id={labelId} className="truncate">
              {node.label}
            </span>
          </div>
          {isOpen && <ul role="group" className="mt-0.5 grid gap-0.5">{render(node.children!, level + 1, `${path}${i}-`)}</ul>}
        </li>
      );
    });

  return (
    <ul
      ref={tree}
      role="tree"
      aria-label={label}
      className={cn("grid gap-0.5", className)}
      onKeyDown={onKeyDown}
      onFocus={(e) => {
        const id = (e.target as HTMLElement).dataset.id;
        if (id) setFocusId(id);
      }}
    >
      {render(items, 1, "")}
    </ul>
  );
}
