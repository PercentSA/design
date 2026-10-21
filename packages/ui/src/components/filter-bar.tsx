import { useRef } from "react";
import { Check, ChevronDown } from "lucide-react";
import { DropdownMenu as RadixDropdown } from "radix-ui";
import { cn } from "../lib/cn";
import { useFlip } from "../lib/flip";
import { useStrings, useText } from "../provider";
import { Button } from "./actions";
import { Badge, Tag } from "./feedback";
import { MENU_ITEM } from "./inputs";
import { SearchInput } from "./special-inputs";

/** One filter: a button with a menu. `multiple` gives checkbox items, otherwise radio items (one choice). Labels are text: they also name the tags. */
export type FilterDef = { key: string; label: string; options: { value: string; label: string }[]; multiple?: boolean };

/** The chosen option values per filter key. */
export type FilterValue = Record<string, string[]>;

const CONTENT = "p-float z-(--p-z-overlay) min-w-48 rounded-field border border-line bg-surface-2 p-1.5 text-fg shadow-overlay";

const Indicator = () => (
  <RadixDropdown.ItemIndicator className="absolute end-3">
    <Check aria-hidden className="size-4" />
  </RadixDropdown.ItemIndicator>
);

/** Search and filter menus above a list or table. Active choices show as removable tags. Controlled. */
export function FilterBar({
  search,
  filters,
  value,
  onValueChange,
  className,
}: {
  search?: { value: string; onValueChange: (value: string) => void; placeholder?: string };
  filters: FilterDef[];
  value: FilterValue;
  onValueChange: (value: FilterValue) => void;
  className?: string;
}) {
  const s = useStrings();
  const t = useText();
  // Removing a tag or clearing removes the focused button; focus goes to a filter button instead of the page.
  const triggers = useRef<Record<string, HTMLButtonElement | null>>({});
  // Tags glide when one is added or removed.
  const root = useRef<HTMLDivElement>(null);
  useFlip(root, [value]);
  const set = (key: string, values: string[]) => onValueChange({ ...value, [key]: values });
  const active = filters.flatMap((f) => (value[f.key] ?? []).map((v) => ({ f, v, label: f.options.find((o) => o.value === v)?.label ?? v })));

  return (
    <div ref={root} role="group" aria-label={s.filters} className={cn("grid gap-3", className)}>
      <div className="flex flex-wrap items-center gap-2">
        {search && (
          <SearchInput
            value={search.value}
            onChange={(e) => search.onValueChange(e.target.value)}
            placeholder={search.placeholder}
            className="h-(--p-control-h-sm) w-full sm:w-64"
          />
        )}
        {filters.map((f) => {
          const chosen = value[f.key] ?? [];
          return (
            <RadixDropdown.Root key={f.key}>
              <RadixDropdown.Trigger asChild>
                <Button
                  ref={(el) => {
                    triggers.current[f.key] = el;
                  }}
                  variant="secondary"
                  className="group"
                >
                  {f.label}
                  {chosen.length > 0 && (
                    <>
                      <Badge variant="solid" aria-hidden="true" className="h-5 min-w-5 justify-center px-1.5 tabular-nums">
                        {chosen.length}
                      </Badge>
                      <span className="sr-only">{s.selectedCount(chosen.length)}</span>
                    </>
                  )}
                  <ChevronDown aria-hidden className="text-fg-3 transition-transform group-data-[state=open]:rotate-180" />
                </Button>
              </RadixDropdown.Trigger>
              <RadixDropdown.Portal>
                <RadixDropdown.Content align="start" sideOffset={6} collisionPadding={16} className={CONTENT}>
                  {f.multiple ? (
                    f.options.map((o) => (
                      <RadixDropdown.CheckboxItem
                        key={o.value}
                        checked={chosen.includes(o.value)}
                        onCheckedChange={(on) => set(f.key, on ? [...chosen, o.value] : chosen.filter((v) => v !== o.value))}
                        // Stay open: people often choose several.
                        onSelect={(e) => e.preventDefault()}
                        className={MENU_ITEM}
                      >
                        {o.label}
                        <Indicator />
                      </RadixDropdown.CheckboxItem>
                    ))
                  ) : (
                    <RadixDropdown.RadioGroup value={chosen[0] ?? ""} onValueChange={(v) => set(f.key, [v])}>
                      {f.options.map((o) => (
                        <RadixDropdown.RadioItem key={o.value} value={o.value} className={MENU_ITEM}>
                          {o.label}
                          <Indicator />
                        </RadixDropdown.RadioItem>
                      ))}
                    </RadixDropdown.RadioGroup>
                  )}
                </RadixDropdown.Content>
              </RadixDropdown.Portal>
            </RadixDropdown.Root>
          );
        })}
      </div>
      {active.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {active.map(({ f, v, label }) => (
            <span key={`${f.key}:${v}`} data-flip={`${f.key}:${v}`} className="flex">
              <Tag
                onRemove={() => {
                  triggers.current[f.key]?.focus();
                  set(f.key, (value[f.key] ?? []).filter((x) => x !== v));
                }}
              >
                {`${f.label}: ${label}`}
              </Tag>
            </span>
          ))}
          <Button
            data-flip="clear"
            variant="ghost"
            size="sm"
            onClick={() => {
              triggers.current[filters[0]!.key]?.focus();
              onValueChange(Object.fromEntries(filters.map((f) => [f.key, []])));
            }}
          >
            {t(s.clearFilters)}
          </Button>
        </div>
      )}
    </div>
  );
}
