import { useEffect, useMemo, useState } from "react";
import { addDays, Badge, Button, type CalendarEvent, CalendarView, Kanban, Link, SegmentedControl, Stack, StatusBadge, Text, todayPlain } from "@percentsa/ui";
import { useT } from "~/lib/t";

const TASKS = {
  brief: { en: "Write the brief", ar: "كتابة الموجز", tag: ["Content", "محتوى"] },
  interviews: { en: "Book user interviews", ar: "حجز مقابلات المستخدمين", tag: ["Research", "بحث"] },
  checkout: { en: "Design the checkout", ar: "تصميم صفحة الدفع", tag: ["Design", "تصميم"] },
  payments: { en: "Set up payments", ar: "إعداد المدفوعات", tag: ["Build", "تطوير"] },
  copy: { en: "Review the Arabic copy", ar: "مراجعة النص العربي", tag: ["Content", "محتوى"] },
  colours: { en: "Brand colours", ar: "ألوان الهوية", tag: ["Design", "تصميم"] },
} as const;
type TaskId = keyof typeof TASKS;

const COLUMNS = [
  { id: "todo", en: "To do", ar: "للتنفيذ" },
  { id: "doing", en: "In progress", ar: "قيد التنفيذ" },
  { id: "review", en: "Review", ar: "مراجعة" },
  { id: "done", en: "Done", ar: "مكتمل" },
];

export function KanbanExample() {
  const t = useT();
  // Order of the card ids per column; the text comes from t() so a language switch keeps the board.
  const [order, setOrder] = useState<Record<string, TaskId[]>>({ todo: ["brief", "interviews"], doing: ["checkout", "payments"], review: ["copy"], done: ["colours"] });
  return (
    <Kanban
      className="w-full"
      columns={COLUMNS.map((c) => ({ id: c.id, title: t(c.en, c.ar), cards: order[c.id]! }))}
      getCardId={(id) => id}
      getCardLabel={(id) => t(TASKS[id].en, TASKS[id].ar)}
      renderCard={(id) => (
        <Stack gap={2} align="start">
          <span className="font-medium">{t(TASKS[id].en, TASKS[id].ar)}</span>
          <Badge>{t(TASKS[id].tag[0], TASKS[id].tag[1])}</Badge>
        </Stack>
      )}
      onMove={(id, to, index) =>
        setOrder((o) => {
          const next = Object.fromEntries(Object.entries(o).map(([k, ids]) => [k, ids.filter((x) => x !== id)]));
          next[to] = next[to]!.toSpliced(index, 0, id as TaskId);
          return next;
        })
      }
    />
  );
}

type Order = { id: string; no: number; customer: [string, string]; items: number; minutes: number; late?: boolean };
type Lane = { orders: Order[]; total: number; state: "ready" | "loading" | "error" };
const LANES = [
  { id: "paid", en: "Paid", ar: "مدفوع", next: ["Prepare", "تجهيز"] },
  { id: "preparing", en: "Preparing", ar: "قيد التجهيز", next: ["Ready", "جاهز"] },
  { id: "ready", en: "Ready", ar: "جاهز", next: ["Ship", "شحن"] },
  { id: "on_the_way", en: "On the way", ar: "في الطريق", next: ["Delivered", "تم التسليم"] },
  { id: "done", en: "Done", ar: "مكتمل", next: null },
] as const;
const NAMES: [string, string][] = [["Ahmed", "أحمد"], ["Sara", "سارة"], ["Khalid", "خالد"], ["Nora", "نورة"], ["Faisal", "فيصل"], ["Huda", "هدى"]];
const PAGE = 3;
const order = (n: number): Order => ({ id: `o${n}`, no: 1000 + n, customer: NAMES[n % NAMES.length]!, items: (n % 4) + 1, minutes: 5 + ((n * 37) % 300), late: n % 5 === 0 });

/**
 * A fulfilment board: server counts, pages of 3 per lane, a lane that is still loading, a lane that failed (Try again), and no drag:
 * the next step is a button on the card. Below 768 px one lane shows, chosen with the switch.
 */
export function KanbanWorkBoardExample() {
  const t = useT();
  const [lanes, setLanes] = useState<Record<string, Lane>>({
    paid: { orders: [1, 2, 3].map(order), total: 8, state: "ready" },
    preparing: { orders: [11, 12].map(order), total: 2, state: "ready" },
    ready: { orders: [], total: 3, state: "error" },
    on_the_way: { orders: [], total: 0, state: "loading" },
    done: { orders: [], total: 0, state: "ready" },
  });
  const [lane, setLane] = useState("paid");
  const [more, setMore] = useState<string | null>(null);
  const patch = (id: string, f: (l: Lane) => Lane) => setLanes((all) => ({ ...all, [id]: f(all[id]!) }));
  useEffect(() => {
    if (lanes.on_the_way!.state !== "loading") return;
    const timer = setTimeout(() => patch("on_the_way", () => ({ orders: [21].map(order), total: 1, state: "ready" })), 1500);
    return () => clearTimeout(timer);
  }, [lanes.on_the_way!.state]);
  const advance = (from: string, o: Order) =>
    setLanes((all) => {
      const to = LANES[LANES.findIndex((l) => l.id === from) + 1]!.id;
      return {
        ...all,
        [from]: { ...all[from]!, orders: all[from]!.orders.filter((x) => x.id !== o.id), total: all[from]!.total - 1 },
        [to]: { ...all[to]!, orders: [{ ...o, minutes: 1 }, ...all[to]!.orders], total: all[to]!.total + 1 },
      };
    });
  return (
    <div className="h-[30rem] w-full">
      <Kanban<Order>
        fill
        columnWidth="fill"
        phone="switch"
        column={lane}
        onColumnChange={setLane}
        density="compact"
        columns={LANES.map((l) => {
          const s = lanes[l.id]!;
          return {
            id: l.id,
            title: t(l.en, l.ar),
            cards: s.orders,
            count: s.state === "loading" ? null : s.total,
            state: s.state,
            onRetry: () => patch(l.id, () => ({ orders: [31, 32, 33].map(order), total: 3, state: "ready" })),
            empty: t("No orders", "لا توجد طلبات"),
            hasMore: s.orders.length < s.total && s.state === "ready",
            loadingMore: more === l.id,
            onLoadMore: () => {
              setMore(l.id);
              setTimeout(() => {
                patch(l.id, (x) => ({ ...x, orders: [...x.orders, ...Array.from({ length: Math.min(PAGE, x.total - x.orders.length) }, (_, i) => order(100 + x.orders.length + i))] }));
                setMore(null);
              }, 700);
            },
          };
        })}
        getCardId={(o) => o.id}
        getCardLabel={(o) => t(`Order ${o.no}`, `طلب ${o.no}`)}
        renderCard={(o) => {
          const lane_ = LANES.find((l) => lanes[l.id]!.orders.includes(o))!;
          return (
            <div className="grid gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Link href="#order" className="text-sm font-medium">
                  {t(`Order ${o.no}`, `طلب ${o.no}`)}
                </Link>
                {o.late && <StatusBadge tone="warning">{t("Late", "متأخر")}</StatusBadge>}
              </div>
              <Text size="sm" className="truncate" title={t(o.customer[0], o.customer[1])}>
                {t(o.customer[0], o.customer[1])}
              </Text>
              <Text size="xs" tone="subtle">
                {t(`${o.items} ${o.items === 1 ? "item" : "items"} · ${o.minutes} min ago`, `${o.items} منتجات · قبل ${o.minutes} دقيقة`)}
              </Text>
              {lane_.next && (
                <div className="grid pt-1">
                  <Button size="sm" onClick={() => advance(lane_.id, o)}>
                    {t(lane_.next[0], lane_.next[1])}
                  </Button>
                </div>
              )}
            </div>
          );
        }}
      />
    </div>
  );
}

export function CalendarViewExample() {
  const t = useT();
  const [calendar, setCalendar] = useState<"gregorian" | "hijri">("gregorian");
  const [picked, setPicked] = useState<string>();
  const today = useMemo(todayPlain, []);
  const events: CalendarEvent[] = [
    { id: "kickoff", title: t("Kickoff", "اجتماع الانطلاق"), start: addDays(today, -6) },
    { id: "sprint", title: t("Design sprint", "أسبوع التصميم"), start: addDays(today, -2), end: addDays(today, 2) },
    { id: "review", title: t("Client review", "مراجعة مع العميل"), start: today },
    { id: "invoice", title: t("Invoice due", "استحقاق الفاتورة"), start: today, tone: "muted" },
    { id: "lunch", title: t("Team lunch", "غداء الفريق"), start: today, tone: "muted" },
    { id: "launch", title: t("Launch", "الإطلاق"), start: addDays(today, 9) },
  ];
  const chosen = events.find((e) => e.id === picked);
  return (
    <Stack gap={4} className="w-full">
      <SegmentedControl
        className="self-start"
        aria-label={t("Calendar", "التقويم")}
        value={calendar}
        onValueChange={(v) => setCalendar(v as typeof calendar)}
        options={[
          { value: "gregorian", label: t("Gregorian", "ميلادي") },
          { value: "hijri", label: t("Hijri", "هجري") },
        ]}
      />
      <CalendarView events={events} calendar={calendar} onEventClick={(e) => setPicked(e.id)} />
      <Text size="sm" tone="muted" aria-live="polite">
        {chosen ? t(`Chosen: ${chosen.title}`, `المختار: ${chosen.title}`) : t("Choose an event.", "اختر حدثًا.")}
      </Text>
    </Stack>
  );
}
