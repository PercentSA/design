import { describe, expect, test } from "bun:test";
import { useState } from "react";
import { act } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PercentProvider } from "../src";
import { CalendarView, type CalendarEvent } from "../src/components/calendar-view";
import { dropIndex, Kanban } from "../src/components/kanban";
import { click, mount, useDom } from "./dom";

useDom();

type Task = { id: string; name: string };
const COLUMNS = [
  { id: "todo", title: "To do", cards: [{ id: "a", name: "Write brief" }, { id: "b", name: "Book venue" }] },
  { id: "doing", title: "Doing", cards: [{ id: "c", name: "Design logo" }] },
  { id: "done", title: "Done", cards: [] as Task[] },
];

type Move = [string, string, number];

function Board({ moves, lang = "en" }: { moves: Move[]; lang?: "en" | "ar" }) {
  const [columns, setColumns] = useState(COLUMNS);
  return (
    <PercentProvider lang={lang}>
      <Kanban
        columns={columns}
        getCardId={(t) => t.id}
        getCardLabel={(t) => t.name}
        renderCard={(t) => <p>{t.name}</p>}
        onMove={(id, to, index) => {
          moves.push([id, to, index]);
          setColumns((cols) => {
            const card = cols.flatMap((c) => c.cards).find((t) => t.id === id)!;
            const rest = cols.map((c) => ({ ...c, cards: c.cards.filter((t) => t.id !== id) }));
            return rest.map((c) => (c.id === to ? { ...c, cards: c.cards.toSpliced(index, 0, card) } : c));
          });
        }}
      />
    </PercentProvider>
  );
}

const status = () => document.querySelector('[role="status"]')!.textContent;

describe("dropIndex", () => {
  const mids = [10, 30, 50];
  test("the gap under the pointer, from the cards' vertical midpoints", () => {
    expect(dropIndex(mids, 0).slot).toBe(0);
    expect(dropIndex(mids, 20).slot).toBe(1);
    expect(dropIndex(mids, 60)).toEqual({ slot: 3, index: 3 });
    expect(dropIndex([], 5)).toEqual({ slot: 0, index: 0 });
  });
  test("in the same column the card leaves its place first", () => {
    // Card 0 dropped below card 2 ends at index 2, not 3.
    expect(dropIndex(mids, 60, 0)).toEqual({ slot: 3, index: 2 });
    // Dropped just above or below itself: no move.
    expect(dropIndex(mids, 20, 0).index).toBe(0);
    expect(dropIndex(mids, 5, 0).index).toBe(0);
    // Moving up does not shift.
    expect(dropIndex(mids, 5, 2)).toEqual({ slot: 0, index: 0 });
  });
});

describe("Kanban", () => {
  test("columns show their title and card count", () => {
    const out = renderToStaticMarkup(<Board moves={[]} />);
    expect(out).toMatch(/To do.*2/);
    expect(out).toMatch(/Done.*0/);
    expect(out).toContain('draggable="true"');
    expect(out).toContain('aria-label="Move Write brief"');
  });

  test("the Move menu reorders in the column and lists the other columns (card goes to the end)", async () => {
    const moves: Move[] = [];
    const el = await mount(<Board moves={moves} />);
    await act(async () => {
      const trigger = el.querySelector('[aria-label="Move Book venue"]')!;
      trigger.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerType: "mouse" } as PointerEventInit));
    });
    const items = [...document.querySelectorAll('[role="menuitem"]')];
    expect(items.map((i) => i.textContent)).toEqual(["Move up one", "Move to the top", "Move to Doing", "Move to Done"]);
    await click(items[2]!);
    expect(moves).toEqual([["b", "doing", 1]]);
    expect(status()).toBe("Book venue moved to Doing");
    // Keyboard users keep their place: focus follows the card.
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Move Book venue");
  });

  test("Arabic: menu and announcement in Arabic", async () => {
    const moves: Move[] = [];
    const el = await mount(<Board moves={moves} lang="ar" />);
    await act(async () => {
      el.querySelector('[aria-label="نقل Design logo"]')!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerType: "mouse" } as PointerEventInit));
    });
    const done = [...document.querySelectorAll('[role="menuitem"]')].find((i) => i.textContent === "انقل إلى Done")!;
    await click(done);
    expect(moves).toEqual([["c", "done", 0]]);
    expect(status()).toBe("تم نقل Design logo إلى Done");
  });

  test("drag and drop calls onMove with the drop index", async () => {
    const moves: Move[] = [];
    const el = await mount(<Board moves={moves} />);
    // happy-dom's DragEvent drops dataTransfer and clientY; set them by hand.
    const fire = (target: Element, type: string, clientY = 0) =>
      act(async () => {
        const e = new Event(type, { bubbles: true, cancelable: true });
        Object.assign(e, { clientY, dataTransfer: { setData() {}, effectAllowed: "", dropEffect: "" } });
        target.dispatchEvent(e);
      });
    const card = el.querySelector('[data-card-id="a"]')!;
    const doing = el.querySelector('[data-column="doing"]')!;
    await fire(card, "dragstart");
    await fire(doing, "dragover", 100);
    await fire(doing, "drop", 100);
    await fire(card, "dragend");
    expect(moves).toEqual([["a", "doing", 1]]);
    expect(status()).toBe("Write brief moved to Doing");
  });
});

const EVENTS: CalendarEvent[] = [
  { id: "1", title: "Kickoff", start: "2026-02-10" },
  { id: "2", title: "Workshop", start: "2026-02-10", end: "2026-02-12" },
  { id: "3", title: "Review", start: "2026-02-18", tone: "muted" },
  ...["A", "B", "C", "D", "E"].map((t, i) => ({ id: `x${i}`, title: `Call ${t}`, start: "2026-02-20" })),
];

const titles = (el: Element, day: string) => [...el.querySelectorAll(`table [data-day="${day}"] [data-event]`)].map((e) => e.textContent);

describe("CalendarView", () => {
  test("places events on their days, multi-day events on every day", async () => {
    const el = await mount(<CalendarView events={EVENTS} defaultMonth={{ calendar: "gregorian", year: 2026, month: 2 }} />);
    expect(titles(el, "2026-02-10")).toEqual(["Kickoff", "Workshop"]);
    expect(titles(el, "2026-02-11")).toEqual(["Workshop"]);
    expect(titles(el, "2026-02-12")).toEqual(["Workshop"]);
    expect(titles(el, "2026-02-13")).toEqual([]);
    expect(el.textContent).toContain("February 2026");
  });

  test("more than 3 events: 3 shown, the rest behind “N more”", async () => {
    const el = await mount(<CalendarView events={EVENTS} defaultMonth={{ calendar: "gregorian", year: 2026, month: 2 }} />);
    expect(titles(el, "2026-02-20")).toEqual(["Call A", "Call B", "Call C"]);
    const more = el.querySelector<HTMLButtonElement>('table [data-day="2026-02-20"] button[aria-haspopup]')!;
    expect(more.textContent).toBe("2 more");
    await click(more);
    const dialog = document.querySelector('[role="dialog"]')!;
    expect([...dialog.querySelectorAll("[data-event]")].map((e) => e.textContent)).toEqual(["Call A", "Call B", "Call C", "Call D", "Call E"]);
  });

  test("Hijri month view: Ramadan 1447 starts on 18 February 2026", async () => {
    const el = await mount(<CalendarView events={EVENTS} calendar="hijri" defaultMonth={{ calendar: "hijri", year: 1447, month: 9 }} />);
    const cell = el.querySelector('table [data-day="2026-02-18"]')!;
    expect(cell.textContent).toContain("Review");
    expect(cell.querySelector("[data-number]")!.textContent).toBe("1");
    expect(el.querySelector('table [data-day="2026-02-17"]')!.textContent).toBe("");
    expect(el.textContent).toContain("Ramadan 1447");
  });

  test("month buttons and Today call onMonthChange", async () => {
    const seen: unknown[] = [];
    const el = await mount(<CalendarView events={[]} defaultMonth={{ calendar: "gregorian", year: 2026, month: 12 }} onMonthChange={(m) => seen.push(m)} />);
    await click(el.querySelector('[aria-label="Next month"]')!);
    expect(seen.at(-1)).toEqual({ calendar: "gregorian", year: 2027, month: 1 });
    expect(el.textContent).toContain("January 2027");
    await click(el.querySelector('[aria-label="Previous month"]')!);
    expect(seen.at(-1)).toEqual({ calendar: "gregorian", year: 2026, month: 12 });
    const { monthOf, todayPlain } = await import("../src");
    await click([...el.querySelectorAll("button")].find((b) => b.textContent === "Today")!);
    expect(seen.at(-1)).toEqual(monthOf(todayPlain(), "gregorian"));
  });

  test("controlled month: the view follows the prop", async () => {
    const el = await mount(<CalendarView events={EVENTS} month={{ calendar: "gregorian", year: 2026, month: 3 }} onMonthChange={() => {}} />);
    await click(el.querySelector('[aria-label="Next month"]')!);
    expect(el.textContent).toContain("March 2026");
  });

  test("days are buttons only with onDayClick; events are buttons only with onEventClick", async () => {
    const plain = renderToStaticMarkup(<CalendarView events={EVENTS} defaultMonth={{ calendar: "gregorian", year: 2026, month: 2 }} />);
    expect(plain).not.toContain('aria-label="10 February 2026"');
    const days: string[] = [];
    const picked: string[] = [];
    const el = await mount(
      <CalendarView
        events={EVENTS}
        defaultMonth={{ calendar: "gregorian", year: 2026, month: 2 }}
        onDayClick={(d) => days.push(d)}
        onEventClick={(e) => picked.push(e.id)}
      />,
    );
    await click(el.querySelector('table button[aria-label="10 February 2026"]')!);
    expect(days).toEqual(["2026-02-10"]);
    await click(el.querySelector('table [data-day="2026-02-11"] button[data-event]')!);
    expect(picked).toEqual(["2"]);
  });

  test("agenda lists only the days with events", async () => {
    const el = await mount(<CalendarView events={EVENTS} defaultMonth={{ calendar: "gregorian", year: 2026, month: 2 }} />);
    const agenda = el.querySelector("ol")!;
    expect([...agenda.querySelectorAll("[data-day]")].map((d) => d.getAttribute("data-day"))).toEqual([
      "2026-02-10",
      "2026-02-11",
      "2026-02-12",
      "2026-02-18",
      "2026-02-20",
    ]);
    expect(agenda.querySelectorAll('[data-day="2026-02-20"] [data-event]')).toHaveLength(5);
  });

  test("Arabic render: month name, weekdays, more label, mirrored chevrons", () => {
    const out = renderToStaticMarkup(
      <PercentProvider lang="ar">
        <CalendarView events={EVENTS} defaultMonth={{ calendar: "gregorian", year: 2026, month: 2 }} />
      </PercentProvider>,
    );
    expect(out).toContain("فبراير 2026");
    expect(out).toContain("الأحد");
    expect(out).toContain("المزيد (2)");
    expect(out).toContain('aria-label="الشهر التالي"');
    expect(out).toContain(">اليوم<");
    expect(out).toContain("rtl:-scale-x-100");
  });
});

describe("Kanban reorder from the menu", () => {
  test("moves the card in its column, announces its new place and keeps the focus on it", async () => {
    const moves: Move[] = [];
    const el = await mount(<Board moves={moves} />);
    await act(async () => {
      el.querySelector('[aria-label="Move Write brief"]')!.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerType: "mouse" } as PointerEventInit));
    });
    const down = [...document.querySelectorAll('[role="menuitem"]')].find((i) => i.textContent === "Move down one")!;
    await click(down);
    expect(moves).toEqual([["a", "todo", 1]]);
    expect([...el.querySelectorAll('[data-column="todo"] [data-card-id]')].map((c) => c.getAttribute("data-card-id"))).toEqual(["b", "a"]);
    expect(status()).toBe("Write brief: 2 of 2");
    // The menu gives the focus back to its button one task later.
    await act(async () => new Promise((r) => setTimeout(r, 10)));
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Move Write brief");
  });
});
