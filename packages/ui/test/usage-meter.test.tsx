import { describe, expect, test } from "bun:test";
import { UsageMeter } from "../src/components/usage-meter";
import { mount, useDom } from "./dom";

useDom();

const meter = (el: Element) => el.querySelector('[role="meter"]')!;
const fills = (el: Element) => [...el.querySelectorAll("[data-fill]")] as HTMLElement[];

describe("UsageMeter", () => {
  test("shows the label and the formatted value", async () => {
    const el = await mount(<UsageMeter label="CPU" value={42} />);
    const m = meter(el);
    expect(m.getAttribute("aria-valuemin")).toBe("0");
    expect(m.getAttribute("aria-valuemax")).toBe("100");
    expect(m.getAttribute("aria-valuenow")).toBe("42");
    expect(m.getAttribute("aria-valuetext")).toBe("42 %");
    const name = m.getAttribute("aria-labelledby")!;
    expect(document.getElementById(name)?.textContent).toBe("CPU");
    expect(el.textContent).toContain("42 %");
  });

  test("null value shows No data and an empty track", async () => {
    const el = await mount(<UsageMeter label="CPU" value={null} />);
    expect(el.textContent).toContain("No data");
    expect(meter(el).hasAttribute("aria-valuenow")).toBe(false);
    expect(fills(el)).toHaveLength(0);
  });

  test("NaN and Infinity count as no data", async () => {
    for (const v of [NaN, Infinity]) {
      const el = await mount(<UsageMeter label="CPU" value={v} />);
      expect(el.textContent).toContain("No data");
      expect(meter(el).hasAttribute("aria-valuenow")).toBe(false);
    }
  });

  test("value above max fills the track and shows the real value", async () => {
    const el = await mount(<UsageMeter label="CPU" value={150} />);
    expect(fills(el)[0]!.style.inlineSize).toBe("100%");
    expect(el.textContent).toContain("150 %");
    expect(meter(el).getAttribute("aria-valuenow")).toBe("100");
  });

  test("above the limit the value is in the warning color", async () => {
    const above = await mount(<UsageMeter label="CPU" value={91} limit={{ value: 90 }} />);
    expect(above.querySelector("[data-value]")!.className).toContain("text-warning");
    expect(fills(above)[0]!.className).toContain("bg-warning");
    expect(above.querySelector("[data-over]")).not.toBeNull(); // a word, not only color
    const at = await mount(<UsageMeter label="CPU" value={90} limit={{ value: 90 }} />);
    expect(at.querySelector("[data-value]")!.className).not.toContain("text-warning");
    expect(fills(at)[0]!.className).not.toContain("bg-warning");
    expect(at.querySelector("[data-over]")).toBeNull();
  });

  test("limit mark sits at its place with its label", async () => {
    const el = await mount(<UsageMeter label="CPU" value={10} limit={{ value: 80, label: "Alert at 80 %" }} />);
    const mark = el.querySelector("[data-limit]") as HTMLElement;
    expect(mark.style.insetInlineStart).toBe("80%");
    expect(el.textContent).toContain("Alert at 80 %");
  });

  test("parts add up, cut to the track, and a legend names each", async () => {
    const parts = [
      { label: "Used", value: 30, tone: "used" as const },
      { label: "Held", value: 20, tone: "held" as const },
    ];
    const el = await mount(<UsageMeter label="Disk" value={null} parts={parts} />);
    expect(meter(el).getAttribute("aria-valuenow")).toBe("50");
    expect(el.textContent).toContain("50 %");
    expect(fills(el).map((f) => f.style.inlineSize)).toEqual(["30%", "20%"]);
    expect(fills(el)[1]!.className).toContain("bg-primary/40");
    const legend = el.querySelector("ul")!.textContent!;
    for (const w of ["Used", "30 %", "Held", "20 %"]) expect(legend).toContain(w);
    const big = await mount(
      <UsageMeter label="Disk" value={0} parts={[{ label: "A", value: 100, tone: "used" }, { label: "B", value: 30, tone: "held" }]} />,
    );
    expect(fills(big).map((f) => f.style.inlineSize)).toEqual(["100%", "0%"]);
  });

  test("custom format", async () => {
    const el = await mount(<UsageMeter label="Disk" value={50} max={200} format={(n) => `${n} GB`} />);
    expect(el.textContent).toContain("50 GB");
    expect(fills(el)[0]!.style.inlineSize).toBe("25%");
  });

  test("stale mutes the track and warns in the data line; at alone says Updated", async () => {
    const at = new Date(Date.now() - 5 * 60_000);
    const stale = await mount(<UsageMeter label="CPU" value={42} at={at} stale />);
    expect(stale.querySelector("[data-track]")!.className).toContain("opacity-50");
    const line = stale.querySelector("[data-line]")!;
    expect(line.className).toContain("text-warning");
    expect(line.textContent!.startsWith("From the last report")).toBe(true);
    const fresh = await mount(<UsageMeter label="CPU" value={42} at={at} />);
    const l2 = fresh.querySelector("[data-line]")!;
    expect(l2.textContent).toContain("Updated");
    expect(l2.querySelector("time")).not.toBeNull();
    expect(l2.className).not.toContain("text-warning");
  });

  test("held stripes use a variable the tokens define", async () => {
    const tokens = await Bun.file(new URL("../../tokens/dist/tokens.css", import.meta.url)).text();
    const el = await mount(<UsageMeter label="Disk" value={0} parts={[{ label: "H", value: 20, tone: "held" }]} />);
    const style = (fills(el)[0] as HTMLElement).getAttribute("style")!;
    const names = [...style.matchAll(/var\((--[\w-]+)\)/g)].map((m) => m[1]!);
    expect(names.length).toBeGreaterThan(0);
    for (const n of names) expect(tokens).toContain(`${n}:`);
  });

  test("a bad max counts as no data", async () => {
    for (const max of [0, -5, NaN, Infinity]) {
      const el = await mount(<UsageMeter label="X" value={10} max={max} />);
      expect(el.textContent).toContain("No data");
      expect(el.textContent).not.toMatch(/NaN|Infinity/);
      expect(el.innerHTML).not.toMatch(/NaN|Infinity/);
      expect(meter(el).hasAttribute("aria-valuenow")).toBe(false);
    }
  });

  test("a negative value counts as 0 for the bar and aria-valuenow, and the text keeps it", async () => {
    const el = await mount(<UsageMeter label="X" value={-5} format={(n) => `${n} GB`} />);
    expect(meter(el).getAttribute("aria-valuenow")).toBe("0");
    expect(fills(el)[0]!.style.inlineSize).toBe("0%");
    expect(el.textContent).toContain("-5 GB");
  });

  test("the limit mark stays inside the track and is centered", async () => {
    for (const v of [100, 150, -10]) {
      const el = await mount(<UsageMeter label="X" value={10} limit={{ value: v }} />);
      const mark = el.querySelector("[data-limit]") as HTMLElement;
      expect(mark.style.insetInlineStart).toBe(v === -10 ? "0%" : "100%");
      expect(mark.className).toContain("-translate-x-1/2");
      expect(mark.className).toContain("rtl:translate-x-1/2");
    }
  });
});

describe("UsageMeter values keep their word order", () => {
  test("the total, the part values and the limit label are in bdi", async () => {
    const el = await mount(<UsageMeter label="Disk" value={42} parts={[{ label: "Used", value: 30, tone: "used" }]} limit={{ value: 90, label: "Limit 90 %" }} />);
    const bdi = [...el.querySelectorAll("bdi")].map((b) => b.textContent);
    expect(bdi).toEqual(["30 %", "30 %", "Limit 90 %"]);
  });
});
