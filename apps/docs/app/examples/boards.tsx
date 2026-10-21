import { useMemo, useState } from "react";
import { addDays, Badge, type CalendarEvent, CalendarView, Kanban, SegmentedControl, Stack, Text, todayPlain } from "@percentsa/ui";
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
