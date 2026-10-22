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
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  items: { term: ReactNode; details: ReactNode }[];
  action?: ReactNode;
  headingLevel?: 2 | 3;
  className?: string;
}) {
  const s = useStrings();
  return (
    <Card title={title} description={description} action={action} headingLevel={headingLevel} className={className}>
      <DescriptionList
        layout="columns"
        items={items.map((i) => ({ term: i.term, details: empty(i.details) ? <span className="text-fg-3">{s.notSet}</span> : i.details }))}
      />
    </Card>
  );
}
