"use client";

import { Children, type ReactNode } from "react";
import { Avatar as RadixAvatar } from "radix-ui";
import { cn } from "../lib/cn";
import { useStrings } from "../provider";
import { initials } from "../lib/initials";

const SIZE = { sm: "size-7 text-[11px]", md: "size-9 text-xs", lg: "size-12 text-sm" } as const;
const CIRCLE = "inline-grid shrink-0 place-items-center overflow-hidden rounded-pill bg-surface-2 font-medium text-fg-2 select-none";

type Size = keyof typeof SIZE;

/** A person's picture, or their initials while it loads or when there is none. Named by `name`. */
export function Avatar({ src, name, size = "md", className }: { src?: string; name: string; size?: Size; className?: string }) {
  return (
    <RadixAvatar.Root role="img" aria-label={name} className={cn(CIRCLE, SIZE[size], className)}>
      {src && <RadixAvatar.Image src={src} alt="" className="size-full object-cover" />}
      <RadixAvatar.Fallback aria-hidden="true">{initials(name)}</RadixAvatar.Fallback>
    </RadixAvatar.Root>
  );
}

/**
 * Overlapping Avatars. With `max`, shows that many and "+N" for the rest. Give it the same `size` as the Avatars.
 * The rings that separate them take the page colour; set `--p-avatar-ring` on a parent with another background (Card does).
 */
export function AvatarGroup({ max, size = "md", children, className }: { max?: number; size?: Size; children: ReactNode; className?: string }) {
  const s = useStrings();
  const all = Children.toArray(children);
  const shown = max === undefined ? all : all.slice(0, max);
  const rest = all.length - shown.length;
  return (
    <div className={cn("flex items-center -space-x-2 [&>*]:ring-2 [&>*]:ring-[color:var(--p-avatar-ring,var(--p-bg))]", className)}>
      {shown}
      {rest > 0 && (
        <span role="img" aria-label={s.moreCount(rest)} dir="ltr" className={cn(CIRCLE, SIZE[size], "tabular-nums")}>
          {`+${rest}`}
        </span>
      )}
    </div>
  );
}
