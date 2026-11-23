import { describe, expect, test } from "bun:test";
import { PercentProvider, TimeText } from "../src";
import { click, mount, useDom } from "./dom";

useDom();

const now = new Date("2026-09-27T12:45:00Z"); // 15:45 in Riyadh
const yesterday = "2026-09-26T12:45:00Z";

describe("TimeText kind", () => {
  test('kind="time" shows the clock and the full time in the tooltip', async () => {
    const el = await mount(
      <PercentProvider lang="en">
        <TimeText value={yesterday} kind="time" now={now} />
        <TimeText value={yesterday} kind="time" now={now} hourCycle="h23" />
      </PercentProvider>,
    );
    const [a, b] = [...el.querySelectorAll("time")];
    expect(a!.textContent).toBe("3:45 PM");
    expect(b!.textContent).toBe("15:45");
    expect(a!.getAttribute("datetime")).toBe("2026-09-26T12:45:00.000Z");
    await click(a!);
    expect(document.body.textContent).toContain("Saturday 26 September 2026, 3:45:00 PM");
  });

  test('kind="time" in Arabic uses Western digits', async () => {
    const el = await mount(
      <PercentProvider lang="ar">
        <TimeText value={yesterday} kind="time" now={now} />
      </PercentProvider>,
    );
    expect(el.querySelector("time")!.textContent).toBe("3:45 م");
  });

  test('kind="time" is ignored with ago', async () => {
    const el = await mount(
      <PercentProvider lang="en">
        <TimeText value={yesterday} kind="time" ago now={now} />
        <TimeText value={yesterday} ago now={now} />
      </PercentProvider>,
    );
    const [a, b] = [...el.querySelectorAll("time")];
    expect(a!.textContent).toBe(b!.textContent);
  });

  test('kind="instant" does not change', async () => {
    const el = await mount(
      <PercentProvider lang="en">
        <TimeText value={yesterday} kind="instant" now={now} />
      </PercentProvider>,
    );
    expect(el.querySelector("time")!.textContent).toBe("Yesterday 3:45 PM");
  });
});
