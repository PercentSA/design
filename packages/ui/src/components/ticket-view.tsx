import type { ReactNode } from "react";
import { Lock, Paperclip } from "lucide-react";
import { cn } from "../lib/cn";
import { useStrings } from "../provider";
import { initials } from "./avatar";
import { formatFileSize } from "./file-drop";

export type TicketMessage = {
  id: string;
  author: { name: string; avatar?: ReactNode };
  time: ReactNode;
  body: ReactNode;
  /** A note for the team only: dashed border and a label. */
  internal?: boolean;
  /** `size` in bytes. */
  attachments?: { name: string; href: string; size?: number }[];
};

function Message({ m }: { m: TicketMessage }) {
  const s = useStrings();
  return (
    <article className={cn("rounded-card border p-5", m.internal ? "border-dashed border-line-strong bg-surface" : "border-line bg-bg")}>
      <header className="flex items-center gap-3">
        {m.author.avatar ?? (
          <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-pill bg-surface-2 text-xs font-medium text-fg-2">
            {initials(m.author.name)}
          </span>
        )}
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-medium text-fg">{m.author.name}</span>
          <span className="text-xs text-fg-3">{m.time}</span>
        </div>
        {m.internal && (
          <span className="label ms-auto inline-flex shrink-0 items-center gap-1.5">
            <Lock aria-hidden className="size-3" />
            {s.internalNote}
          </span>
        )}
      </header>
      <div className="mt-3 text-sm text-fg-2">{m.body}</div>
      {!!m.attachments?.length && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="text-xs text-fg-3">{s.attachments}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {m.attachments.map((a) => (
              <li key={a.href}>
                <a href={a.href} className="inline-flex h-8 items-center gap-2 rounded-pill border border-line-strong px-3 text-sm text-fg-2 hover:text-fg">
                  <Paperclip aria-hidden className="size-3.5" />
                  {a.name}
                  {a.size != null && (
                    <span dir="ltr" className="text-xs text-fg-3 tabular-nums">
                      {formatFileSize(a.size)}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

/** A support ticket: subject, id and status; the thread with a reply form under it; details in a side panel when the view is at least 768 px wide. */
export function TicketView({
  subject,
  id,
  status,
  meta,
  messages,
  composer,
  headingLevel = 1,
  className,
}: {
  subject: ReactNode;
  id: string;
  /** For example a Badge. */
  status: ReactNode;
  meta: { term: ReactNode; details: ReactNode }[];
  messages: TicketMessage[];
  /** The reply form. */
  composer?: ReactNode;
  /** Level of the subject heading. Default 1 (the ticket is the page). */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}) {
  const H = `h${headingLevel}` as const;
  return (
    <div className={cn("@container grid gap-8", className)}>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div className="grid gap-1.5">
          <p className="font-mono text-xs text-fg-3">
            <span dir="ltr">{id}</span>
          </p>
          <H className="heading text-2xl">{subject}</H>
        </div>
        <div className="shrink-0">{status}</div>
      </header>
      <div className="grid gap-8 @3xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid min-w-0 content-start gap-4">
          {messages.map((m) => (
            <Message key={m.id} m={m} />
          ))}
          {composer}
        </div>
        <aside>
          <dl className="grid gap-4 rounded-card border border-line bg-surface p-5 text-sm">
            {meta.map((item, i) => (
              <div key={i} className="grid gap-1">
                <dt className="text-xs text-fg-3">{item.term}</dt>
                <dd className="text-fg">{item.details}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </div>
  );
}
