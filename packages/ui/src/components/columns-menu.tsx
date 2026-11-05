"use client";

import { Check, Columns3 } from "lucide-react";
import { DropdownMenu as RadixDropdown } from "radix-ui";
import { useStrings, useText } from "../provider";
import { Button } from "./actions";
import type { DataTableColumn } from "./data-table";
import { MENU_ITEM } from "./input-classes";

const CONTENT = "p-float z-(--p-z-overlay) min-w-48 rounded-field border border-line bg-surface-2 p-1.5 text-fg shadow-overlay";

/** Shows and hides table columns. Takes the DataTable's columns and lists the hideable ones; give `hidden` to DataTable as `hiddenColumns`. */
export function ColumnsMenu({
  columns,
  hidden,
  onHiddenChange,
  className,
}: {
  columns: Pick<DataTableColumn<unknown>, "key" | "header" | "hideable">[];
  /** Keys of the hidden columns. */
  hidden: string[];
  onHiddenChange: (hidden: string[]) => void;
  className?: string;
}) {
  const s = useStrings();
  const t = useText();
  return (
    <RadixDropdown.Root>
      <RadixDropdown.Trigger asChild>
        <Button variant="secondary" className={className}>
          <Columns3 aria-hidden />
          {t(s.columns)}
        </Button>
      </RadixDropdown.Trigger>
      <RadixDropdown.Portal>
        <RadixDropdown.Content align="end" sideOffset={6} collisionPadding={16} className={CONTENT}>
          {columns
            .filter((c) => c.hideable !== false)
            .map((c) => (
              <RadixDropdown.CheckboxItem
                key={c.key}
                checked={!hidden.includes(c.key)}
                onCheckedChange={(on) => onHiddenChange(on ? hidden.filter((k) => k !== c.key) : [...hidden, c.key])}
                // Stay open: people often change several columns.
                onSelect={(e) => e.preventDefault()}
                className={MENU_ITEM}
              >
                {c.header}
                <RadixDropdown.ItemIndicator className="absolute end-3">
                  <Check aria-hidden className="size-4" />
                </RadixDropdown.ItemIndicator>
              </RadixDropdown.CheckboxItem>
            ))}
        </RadixDropdown.Content>
      </RadixDropdown.Portal>
    </RadixDropdown.Root>
  );
}
