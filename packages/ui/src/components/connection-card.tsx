import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { CopyButton } from "./actions";
import { Card } from "./card";
import { DescriptionList } from "./list";
import { MaskedValue, type MaskedValueProps } from "./masked-value";

export type ConnectionRow = { term: ReactNode; value?: ReactNode; copy?: string; copyLabel?: string; masked?: MaskedValueProps };

/** How to reach a service: rows of term and value. `masked` shows a secret, `copy` adds a copy button to the value; `copyLabel` names it ("Copy host"). */
export function ConnectionCard({ title, rows, action, className }: { title: ReactNode; rows: ConnectionRow[]; action?: ReactNode; className?: string }) {
  return (
    <Card title={title} headingLevel={2} density="compact" action={action} className={cn("min-w-0", className)}>
      <DescriptionList
        layout="auto"
        density="compact"
        items={rows.map((r) => ({
          term: r.term,
          details: r.masked ? (
            <MaskedValue {...r.masked} />
          ) : r.copy != null ? (
            <span className="flex min-w-0 items-center gap-1">
              <span className="min-w-0 break-all font-mono">{r.value ?? r.copy}</span>
              <CopyButton value={r.copy} label={r.copyLabel} iconOnly />
            </span>
          ) : (
            r.value
          ),
        }))}
      />
    </Card>
  );
}
