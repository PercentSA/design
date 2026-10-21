"use client";

import type { ReactNode } from "react";
import { ContextMenu as RadixContextMenu, DropdownMenu as RadixDropdown } from "radix-ui";
import { cn } from "../lib/cn";
import { useLinkComponent, useStrings } from "../provider";
import { MENU_ITEM } from "./input-classes";

export type MenuItem =
  | "separator"
  | { heading: ReactNode }
  | {
      label: ReactNode;
      onSelect?: () => void;
      /** A link item, rendered with the provider's link component (router links, open in a new tab). */
      href?: string;
      target?: string;
      icon?: ReactNode;
      shortcut?: string;
      danger?: boolean;
      disabled?: boolean;
    };

const CONTENT = "p-float z-(--p-z-overlay) min-w-48 rounded-field border border-line bg-surface-2 p-1.5 text-fg shadow-overlay";

// Dropdown and context menus share their part names, so one renderer serves both.
type Parts = typeof RadixDropdown | typeof RadixContextMenu;

function Items({ parts: P, items }: { parts: Parts; items: MenuItem[] }) {
  const L = useLinkComponent();
  const s = useStrings();
  return items.map((item, i) => {
    if (item === "separator") return <P.Separator key={i} className="-mx-1.5 my-1.5 h-px bg-line" />;
    if ("heading" in item)
      return (
        <P.Label key={i} className="px-3 pt-2 pb-1 text-xs text-fg-3">
          {item.heading}
        </P.Label>
      );
    const content = (
      <>
        {item.icon}
        <span className="flex-1">{item.label}</span>
        {item.shortcut && (
          <kbd dir="ltr" className="font-mono text-xs text-fg-3">
            {item.shortcut}
          </kbd>
        )}
      </>
    );
    // A disabled link item renders as a plain disabled item: nothing to follow.
    const link = !!item.href && !item.disabled;
    return (
      <P.Item
        key={i}
        asChild={link}
        onSelect={item.onSelect}
        disabled={item.disabled}
        className={cn(MENU_ITEM, "pe-3 [&_svg]:size-4", item.danger && "text-danger data-highlighted:text-danger")}
      >
        {link ? (
          <L href={item.href} target={item.target} rel={item.target === "_blank" ? "noopener noreferrer" : undefined}>
            {content}
            {item.target === "_blank" && <span className="sr-only"> {s.newTab}</span>}
          </L>
        ) : (
          content
        )}
      </P.Item>
    );
  });
}

export function DropdownMenu({
  trigger,
  items,
  align = "start",
  open,
  defaultOpen,
  onOpenChange,
}: {
  trigger: ReactNode;
  items: MenuItem[];
  align?: "start" | "center" | "end";
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <RadixDropdown.Root open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <RadixDropdown.Trigger asChild>{trigger}</RadixDropdown.Trigger>
      <RadixDropdown.Portal>
        <RadixDropdown.Content align={align} sideOffset={6} collisionPadding={16} className={CONTENT}>
          <Items parts={RadixDropdown} items={items} />
        </RadixDropdown.Content>
      </RadixDropdown.Portal>
    </RadixDropdown.Root>
  );
}

/** Right-click (long-press on touch) menu for an area. Offer the same actions elsewhere too. */
export function ContextMenu({ children, items }: { children: ReactNode; items: MenuItem[] }) {
  return (
    <RadixContextMenu.Root>
      <RadixContextMenu.Trigger asChild>{children}</RadixContextMenu.Trigger>
      <RadixContextMenu.Portal>
        <RadixContextMenu.Content collisionPadding={16} className={CONTENT}>
          <Items parts={RadixContextMenu} items={items} />
        </RadixContextMenu.Content>
      </RadixContextMenu.Portal>
    </RadixContextMenu.Root>
  );
}
