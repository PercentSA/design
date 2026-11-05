"use client";

import type { ReactNode } from "react";
import { useStrings } from "../provider";
import { Card } from "./card";
import { DescriptionList } from "./list";

const empty = (v: ReactNode) => v == null || v === "";

/** A record's facts as text in a Card, with its edit action in the header. Empty details show "Not set". */
export function RecordSection({
  title,
  description,
  items,
  action,
  headingLevel = 2,
  layout = "columns",
  density = "default",
  cols = 1,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  items: { term: ReactNode; details: ReactNode }[];
  action?: ReactNode;
  headingLevel?: 2 | 3;
  /** `columns` (default): side by side from 768 px of the screen. `auto`: when the section itself is 28rem wide or more.
   *  `stack`: term above details (with `cols`, for short facts such as money rows). */
  layout?: "stack" | "columns" | "auto";
  /** `compact` for dense records. */
  density?: "default" | "compact";
  /** 2 or 3: the facts flow in columns; `layout` still sets each pair (see DescriptionList). */
  cols?: 1 | 2 | 3;
  className?: string;
}) {
  const s = useStrings();
  return (
    <Card title={title} description={description} action={action} headingLevel={headingLevel} density={density} className={className}>
      <DescriptionList
        layout={layout}
        density={density}
        cols={cols}
        items={items.map((i) => ({ term: i.term, details: empty(i.details) ? <span className="text-fg-3">{s.notSet}</span> : i.details }))}
      />
    </Card>
  );
}
