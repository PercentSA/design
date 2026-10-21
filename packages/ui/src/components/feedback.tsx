import type { HTMLAttributes, ReactNode } from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { Progress as RadixProgress } from "radix-ui";
import { cn } from "../lib/cn";
import { useBrand, useStrings } from "../provider";
import { Mark } from "./brand";

const ALERT = {
  info: { icon: Info, color: "text-fg-2", border: "border-line" },
  success: { icon: CircleCheck, color: "text-success", border: "border-line" },
  warning: { icon: TriangleAlert, color: "text-warning", border: "border-warning/40" },
  danger: { icon: CircleAlert, color: "text-danger", border: "border-danger/40" },
} as const;

/** A message in the page. Errors and warnings are announced at once; info and success when the reader is free. */
export function Alert({
  tone = "info",
  title,
  children,
  action,
  className,
}: {
  tone?: keyof typeof ALERT;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const t = ALERT[tone];
  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-field border bg-surface p-4 text-sm", t.border, className)}
    >
      <t.icon aria-hidden className={cn("mt-0.5 size-4 shrink-0", t.color)} />
      <div className="grid flex-1 gap-1">
        <p className="font-medium text-fg">{title}</p>
        {children && <div className="text-fg-2">{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

const BADGE = {
  solid: "bg-fg text-bg",
  subtle: "bg-surface-2 text-fg-2",
  outline: "border border-line-strong text-fg-2",
} as const;

export const Badge = ({ variant = "subtle", className, ...rest }: HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof BADGE }) => (
  <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-pill px-2.5 text-xs font-medium whitespace-nowrap", BADGE[variant], className)} {...rest} />
);

/** A label that can be removed (filters, chosen items). */
export function Tag({ children, onRemove, className }: { children: string; onRemove?: () => void; className?: string }) {
  const s = useStrings();
  return (
    <span className={cn("inline-flex h-8 items-center gap-1 rounded-pill border border-line-strong ps-3 text-sm text-fg-2", onRemove ? "pe-1" : "pe-3", className)}>
      {children}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={s.remove(children)} className="grid size-6 place-items-center rounded-pill text-fg-3 hover:bg-surface-2 hover:text-fg">
          <X aria-hidden className="size-3.5" />
        </button>
      )}
    </span>
  );
}

const DOT = { live: "bg-live", idle: "bg-fg-3", warning: "bg-warning", danger: "bg-danger" } as const;

/** Small coloured dot: the only place green is allowed. Give it text; colour alone says nothing. */
export function StatusDot({ status, children, className }: { status: keyof typeof DOT; children?: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm text-fg-2", className)}>
      <span aria-hidden="true" className="relative flex size-2">
        {status === "live" && <span className="absolute inset-0 animate-ping rounded-pill bg-live opacity-60 motion-reduce:animate-none" />}
        <span className={cn("relative size-2 rounded-pill", DOT[status])} />
      </span>
      {children}
    </span>
  );
}

type ProgressProps = { value: number; max?: number; "aria-label"?: string; className?: string };

export function Progress({ value, max = 100, className, ...aria }: ProgressProps) {
  return (
    <RadixProgress.Root value={value} max={max} className={cn("relative h-1.5 w-full overflow-hidden rounded-pill bg-line-strong", className)} {...aria}>
      {/* Width, not translate: it fills from the start side in both directions. */}
      <RadixProgress.Indicator className="h-full rounded-pill bg-primary transition-[width] duration-(--p-duration-slow)" style={{ width: `${(value / max) * 100}%` }} />
    </RadixProgress.Root>
  );
}

export function ProgressRing({ value, max = 100, size = 48, showValue, className, ...aria }: ProgressProps & { size?: number; showValue?: boolean }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  const pct = Math.round((value / max) * 100);
  return (
    <span
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
      {...aria}
    >
      <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx="24" cy="24" r={r} fill="none" strokeWidth="4" className="stroke-line-strong" />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / max)}
          className="stroke-primary transition-[stroke-dashoffset] duration-(--p-duration-slow)"
        />
      </svg>
      {showValue && (
        <span dir="ltr" className="text-xs font-medium tabular-nums">
          {pct}%
        </span>
      )}
    </span>
  );
}

/** A grey block where content is loading. Hidden from screen readers; announce loading elsewhere. */
export const Skeleton = ({ className }: { className?: string }) => (
  <div aria-hidden="true" className={cn("animate-pulse rounded-field bg-surface-2 motion-reduce:animate-none", className)} />
);

export function EmptyState({ title, description, action, icon, className }: { title: ReactNode; description?: ReactNode; action?: ReactNode; icon?: ReactNode; className?: string }) {
  const logo = useBrand()?.mark;
  return (
    <div className={cn("flex flex-col items-center gap-3 rounded-card border border-dashed border-line px-6 py-14 text-center", className)}>
      <div className="mb-2 text-fg-3 [&_svg]:size-6">{icon ?? logo ?? <Mark className="h-6" />}</div>
      <p className="heading text-lg">{title}</p>
      {description && <p className="max-w-sm text-sm text-fg-2">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
