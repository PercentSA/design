import { addDays, monthDays, type PlainDate } from "./calendar";

export type PeriodKind = "month" | "quarter" | "year" | "custom";
/** A report period: both ends are included. */
export type Period = { kind: PeriodKind; from: PlainDate; to: PlainDate };

const pad = (n: number) => String(n).padStart(2, "0");
const COUNT = { month: 24, quarter: 8, year: 5 };

/** The Gregorian month, quarter or year that contains `day`. */
export function periodOf(kind: Exclude<PeriodKind, "custom">, day: PlainDate): Period {
  const year = Number(day.slice(0, 4));
  const month = Number(day.slice(5, 7));
  const first = kind === "year" ? 1 : kind === "quarter" ? month - ((month - 1) % 3) : month;
  const last = kind === "year" ? 12 : kind === "quarter" ? first + 2 : month;
  return { kind, from: `${day.slice(0, 4)}-${pad(first)}-01`, to: monthDays({ calendar: "gregorian", year, month: last }).at(-1)! };
}

/** The periods up to the one of `today`, newest first. Default: 24 months, 8 quarters or 5 years. */
export function periodOptions(kind: Exclude<PeriodKind, "custom">, today: PlainDate, count = COUNT[kind]): Period[] {
  const list = [periodOf(kind, today)];
  while (list.length < count) list.push(periodOf(kind, addDays(list.at(-1)!.from, -1)));
  return list;
}
