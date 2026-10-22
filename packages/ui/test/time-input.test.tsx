// TimeInput, DateTimePicker and the 12-hour time helpers (0.8.0).
import { describe, expect, test } from "bun:test";
import { act, useState } from "react";
import { DateTimePicker, Field, joinTime, PercentProvider, splitTime, TimeInput, type Lang } from "../src";
import { click, mount, useDom } from "./dom";

useDom();

const type = (input: HTMLInputElement, value: string) =>
  act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });

function Time({ start, log, lang = "en", name }: { start: string | null; log: string[]; lang?: Lang; name?: string }) {
  const [value, setValue] = useState(start);
  return (
    <PercentProvider lang={lang}>
      <TimeInput
        value={value}
        name={name}
        onValueChange={(t) => {
          log.push(t);
          setValue(t);
        }}
      />
    </PercentProvider>
  );
}
const button = (el: Element, label: string, i = 0) => [...el.querySelectorAll("button")].filter((b) => (b.getAttribute("aria-label") ?? b.textContent) === label)[i]!;
const checked = (el: Element) => el.querySelector('[role="group"] [data-state="on"]')?.textContent;

describe("splitTime and joinTime", () => {
  test('splitTime and joinTime: "00:30" → 12:30 AM, "12:00" → 12 PM, "18:30" → 6:30 PM, and all 1440 minutes give the same value back', () => {
    expect(splitTime("00:30")).toEqual({ hour12: 12, minute: 30, pm: false });
    expect(splitTime("12:00")).toEqual({ hour12: 12, minute: 0, pm: true });
    expect(splitTime("18:30")).toEqual({ hour12: 6, minute: 30, pm: true });
    expect(joinTime(12, 30, false)).toBe("00:30");
    expect(joinTime(12, 0, true)).toBe("12:00");
    expect(joinTime(6, 30, true)).toBe("18:30");
    for (let m = 0; m < 1440; m++) {
      const time = `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
      const t = splitTime(time);
      expect(joinTime(t.hour12, t.minute, t.pm)).toBe(time);
    }
  });
});

describe("TimeInput", () => {
  test("hour 11 → 12 crosses noon (11:00 ص → 12:00 م) and midnight", async () => {
    const log: string[] = [];
    const el = await mount(<Time start="11:00" log={log} lang="ar" />);
    expect(checked(el)).toBe("ص");
    await click(button(el, "زيادة"));
    expect(log.at(-1)).toBe("12:00");
    expect(checked(el)).toBe("م");
    // Back down: 12 PM → 11 AM.
    await click(button(el, "إنقاص"));
    expect(log.at(-1)).toBe("11:00");

    const night: string[] = [];
    const el2 = await mount(<Time start="23:30" log={night} />);
    await click(button(el2, "Increase"));
    expect(night.at(-1)).toBe("00:30");
    expect(checked(el2)).toBe("AM");
    // Midnight shows as 12.
    const h = el2.querySelector<HTMLInputElement>('input[aria-label="Hour"]')!;
    expect(h.value).toBe("12");
  });

  test("the AM/PM switch keeps hour and minute (09:15 → 21:15)", async () => {
    const log: string[] = [];
    const el = await mount(<Time start="09:15" log={log} />);
    await click(button(el, "PM"));
    expect(log).toEqual(["21:15"]);
    await click(button(el, "AM"));
    expect(log.at(-1)).toBe("09:15");
    // The minute steps by 5 and shows two digits; typing a minute keeps the hour.
    await click(button(el, "Increase", 1));
    expect(log.at(-1)).toBe("09:20");
    await type(el.querySelector<HTMLInputElement>('input[aria-label="Minute"]')!, "7");
    expect(log.at(-1)).toBe("09:07");
    // An hour that is not 1–12 is not sent.
    await type(el.querySelector<HTMLInputElement>('input[aria-label="Hour"]')!, "13");
    expect(log.at(-1)).toBe("09:07");
  });

  test("Arabic ص/م labels; the group stays LTR", async () => {
    const el = await mount(<Time start="15:05" log={[]} lang="ar" />);
    const group = el.querySelector('[role="group"]')!;
    expect(group.getAttribute("dir")).toBe("ltr");
    expect([...group.querySelectorAll('[role="radio"]')].map((b) => b.textContent)).toEqual(["ص", "م"]);
    const inputs = [...group.querySelectorAll("input")];
    expect(inputs.map((i) => i.getAttribute("aria-label"))).toEqual(["الساعة", "الدقيقة"]);
    expect(inputs.map((i) => i.value)).toEqual(["3", "05"]);
    expect(checked(el)).toBe("م");
  });

  test("name posts HH:mm; DateTimePicker posts 2026-09-27T09:00 only with both parts", async () => {
    const el = await mount(<Time start="21:15" log={[]} name="opens" />);
    expect(el.querySelector<HTMLInputElement>('input[name="opens"]')!.value).toBe("21:15");
    // The hour and minute boxes do not post.
    expect(el.querySelectorAll("input[name]")).toHaveLength(1);

    const log: { date: string; time: string }[] = [];
    function Both() {
      const [value, setValue] = useState<{ date: string; time: string } | null>(null);
      return (
        <DateTimePicker
          value={value}
          name="at"
          max="2026-09-30"
          onValueChange={(v) => {
            log.push(v);
            setValue(v);
          }}
        />
      );
    }
    const el2 = await mount(<Both />);
    const posted = () => el2.querySelector<HTMLInputElement>('input[name="at"]')!.value;
    expect(posted()).toBe("");
    await type(el2.querySelector<HTMLInputElement>('input[aria-label="Hour"]')!, "9");
    expect(log).toEqual([]);
    expect(posted()).toBe("");
    expect(el2.querySelector<HTMLInputElement>('input[aria-label="Minute"]')!.value).toBe("00");
    await click(el2.querySelector('button[aria-haspopup="dialog"]')!);
    await click(document.querySelector('[data-day="2026-09-27"]')!);
    expect(log).toEqual([{ date: "2026-09-27", time: "09:00" }]);
    expect(posted()).toBe("2026-09-27T09:00");
    // A later change of either part sends at once.
    await click(button(el2, "PM"));
    expect(log.at(-1)).toEqual({ date: "2026-09-27", time: "21:00" });
  });

  test("in a Field the group is labelled by the field label", async () => {
    const el = await mount(
      <Field label="Opens at" id="opens" hint="Riyadh time">
        <TimeInput value="09:00" onValueChange={() => {}} />
      </Field>,
    );
    const group = el.querySelector('[role="group"]')!;
    expect(group.getAttribute("aria-labelledby")).toBe("opens-label");
    expect(group.getAttribute("aria-describedby")).toBe("opens-hint");
    // The label points at the hour box; the minute box has its own id.
    const [hour, minute] = [...group.querySelectorAll("input")];
    expect(hour!.id).toBe("opens");
    expect(minute!.id).not.toBe("opens");
    expect(minute!.id).not.toBe("");

    const el2 = await mount(
      <Field label="Starts" id="starts">
        <DateTimePicker value={null} onValueChange={() => {}} />
      </Field>,
    );
    expect(el2.querySelectorAll("#starts")).toHaveLength(1);
    expect(el2.querySelector('[role="group"]')!.getAttribute("aria-labelledby")).toBe("starts-label");
  });
});
