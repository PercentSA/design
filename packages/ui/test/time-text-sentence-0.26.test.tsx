import { describe, expect, test } from "bun:test";
import { PercentProvider, TimeText, formatDateTime } from "../src";
import { click, mount, useDom } from "./dom";
import { STRINGS } from "../src/i18n/strings";

useDom();

const now = new Date("2026-09-27T12:45:00Z"); // 15:45 in Riyadh
const tomorrow = "2026-09-28T12:45:00Z";

describe("inSentence", () => {
  test("writes the day word in lower case", async () => {
    expect(formatDateTime(tomorrow, { now, inSentence: true })).toBe("tomorrow 3:45 PM");
    const el = await mount(
      <PercentProvider lang="en">
        <TimeText value={tomorrow} now={now} inSentence />
      </PercentProvider>,
    );
    const t = el.querySelector("time")!;
    expect(t.textContent).toBe("tomorrow 3:45 PM");
    await click(t);
    expect(document.body.textContent).toContain("Monday 28 September 2026, 3:45:00 PM");
  });
  test("without it the day word has a capital, as in 0.25.0", () => {
    expect(formatDateTime(tomorrow, { now })).toBe("Tomorrow 3:45 PM");
    expect(formatDateTime(tomorrow, { now, inSentence: false })).toBe("Tomorrow 3:45 PM");
  });
  test("Arabic and dates that start with a digit do not change", () => {
    const ar = formatDateTime(tomorrow, { lang: "ar", now });
    expect(formatDateTime(tomorrow, { lang: "ar", now, inSentence: true })).toBe(ar);
    expect(formatDateTime("2026-09-12T12:45:00Z", { now, inSentence: true })).toBe(formatDateTime("2026-09-12T12:45:00Z", { now }));
    expect(formatDateTime("2025-03-02T08:00:00Z", { now, inSentence: true })).toBe(formatDateTime("2025-03-02T08:00:00Z", { now }));
  });
  test("a calendar day and a custom word", () => {
    expect(formatDateTime("2026-09-28", { now, inSentence: true })).toBe("tomorrow");
    expect(formatDateTime("2026-09-27", { now, inSentence: true })).toBe("today");
    expect(formatDateTime("2026-09-27", { now })).toBe("Today");
    const strings = { ...STRINGS.en, tomorrow: "TomorrowNow" };
    expect(formatDateTime(tomorrow, { now, strings, inSentence: true })).toBe("tomorrowNow 3:45 PM");
  });
  test("with ago it has no effect", async () => {
    const el = await mount(
      <PercentProvider lang="en">
        <TimeText value="2026-09-27T12:40:00Z" ago now={now} />
        <TimeText value="2026-09-27T12:40:00Z" ago now={now} inSentence />
      </PercentProvider>,
    );
    const [a, b] = [...el.querySelectorAll("time")];
    expect(a!.textContent).toBe(b!.textContent);
  });
});
