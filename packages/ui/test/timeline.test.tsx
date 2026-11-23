import { describe, expect, test } from "bun:test";
import { Timeline } from "../src/components/timeline";
import { useState } from "react";
import { click, mount, useDom } from "./dom";

useDom();

const log = <p>line one</p>;

describe("Timeline steps", () => {
  test("old statuses render as before", async () => {
    const el = await mount(
      <Timeline
        items={[
          { id: "a", time: "09:00", title: "A", status: "done" },
          { id: "b", time: "10:00", title: "B", status: "current" },
          { id: "c", time: "12:00", title: "C", status: "next" },
        ]}
      />,
    );
    const dots = [...el.querySelectorAll("li > span > span:first-child")].map((d) => d.className);
    expect(dots[0]).toContain("bg-primary");
    expect(dots[1]).toContain("ring-4 ring-line-strong");
    expect(dots[2]).toContain("border border-line-strong");
    expect(el.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
    expect(el.querySelectorAll(".sr-only")).toHaveLength(1); // only "Done"
    expect(el.textContent).not.toMatch(/Waiting|Running/);
  });

  test("each new status has its dot and a status word", async () => {
    const el = await mount(
      <Timeline
        items={(["failed", "warning", "running", "skipped", "waiting", "done"] as const).map((status) => ({ id: status, title: status, status }))}
      />,
    );
    const li = (s: string) => el.querySelector(`li[data-status="${s}"]`)!;
    const dot = (s: string) => li(s).querySelector("span > span")!.className;
    const word = (s: string) => li(s).querySelector(".sr-only")?.textContent;
    expect(dot("failed")).toContain("bg-danger");
    expect(word("failed")).toBe("Failed");
    expect(dot("warning")).toContain("bg-warning");
    expect(word("warning")).toBe("Warning");
    expect(dot("running")).toContain("bg-primary");
    expect(dot("running")).toContain("motion-safe:animate-pulse");
    expect(word("running")).toBe("Running");
    expect(dot("skipped")).toContain("border-dashed");
    expect(li("skipped").querySelector(".text-sm.font-medium")!.className).toContain("text-fg-3");
    expect(li("waiting").querySelector(".text-sm.font-medium")!.className).toContain("text-fg-3");
    expect(word("skipped")).toBe("Skipped");
    expect(dot("waiting")).toContain("border border-line-strong");
    expect(word("waiting")).toBe("Waiting");
    expect(word("done")).toBe("Done");
  });

  test("duration shows at the end of the title row", async () => {
    const el = await mount(<Timeline items={[{ id: "a", title: "Build", duration: "1 min 12 s" }]} />);
    const d = [...el.querySelectorAll("span")].find((s) => s.textContent === "1 min 12 s")!;
    expect(d.className).toContain("tabular-nums");
    expect(d.previousElementSibling?.textContent).toContain("Build");
  });

  test("a failed step with detail starts open", async () => {
    const el = await mount(<Timeline items={[{ id: "a", title: "Build", status: "failed", detail: log }]} />);
    expect(el.textContent).toContain("line one");
    const b = el.querySelector("button[aria-controls]") as HTMLButtonElement;
    expect(b.textContent).toContain("Hide details");
    expect(b.getAttribute("aria-expanded")).toBe("true");
    expect(el.querySelector(`#${CSS.escape(b.getAttribute("aria-controls")!)}`)).not.toBeNull();
    await click(b);
    expect(el.textContent).not.toContain("line one");
    expect(b.getAttribute("aria-expanded")).toBe("false");
    expect(b.textContent).toContain("Show details");
  });

  test("open false wins over failed", async () => {
    const el = await mount(<Timeline items={[{ id: "a", title: "Build", status: "failed", detail: log, open: false }]} />);
    expect(el.textContent).not.toContain("line one");
  });

  test("a done step with detail starts closed; open true opens it", async () => {
    const el = await mount(<Timeline items={[{ id: "a", title: "Build", status: "done", detail: log }]} />);
    expect(el.textContent).not.toContain("line one");
    const el2 = await mount(<Timeline items={[{ id: "a", title: "Build", status: "done", detail: log, open: true }]} />);
    expect(el2.textContent).toContain("line one");
  });

  test("no time: no empty time line", async () => {
    const el = await mount(<Timeline items={[{ id: "a", title: "Build" }]} />);
    expect(el.querySelector(".text-xs")).toBeNull();
  });

  test("onSelect makes the title a button that calls it with the id", async () => {
    const got: string[] = [];
    const el = await mount(<Timeline onSelect={(id) => got.push(id)} items={[{ id: "build", title: "Build" }]} />);
    const b = [...el.querySelectorAll("button")].find((x) => x.textContent === "Build")!;
    await click(b);
    expect(got).toEqual(["build"]);
  });

  test("without onSelect the title is text", async () => {
    const el = await mount(<Timeline items={[{ id: "build", title: "Build" }]} />);
    expect(el.querySelector("button")).toBeNull();
  });

  test("the open state follows status and open; a click holds until then", async () => {
    function Harness() {
      const [status, setStatus] = useState<"running" | "failed">("running");
      const [open, setOpen] = useState<boolean | undefined>(undefined);
      return (
        <>
          <button id="fail" onClick={() => setStatus("failed")} />
          <button id="close" onClick={() => setOpen(false)} />
          <Timeline items={[{ id: "a", title: "Build", status, open, detail: log }]} />
        </>
      );
    }
    const el = await mount(<Harness />);
    expect(el.textContent).not.toContain("line one");
    await click(el.querySelector("#fail")!);
    expect(el.textContent).toContain("line one");
    await click(el.querySelector("li button")!); // person closes
    expect(el.textContent).not.toContain("line one");
    await click(el.querySelector("#close")!); // open changed: new start state is closed
    expect(el.textContent).not.toContain("line one");
  });

  test("an empty detail gives no button and no region", async () => {
    for (const detail of [false, null, ""]) {
      const el = await mount(<Timeline items={[{ id: "a", title: "Build", status: "failed", detail }]} />);
      expect(el.querySelector("button")).toBeNull();
    }
  });

  test("aria-controls only while open", async () => {
    const el = await mount(<Timeline items={[{ id: "a", title: "Build", detail: log, open: true }]} />);
    const b = el.querySelector("button")!;
    expect(b.hasAttribute("aria-controls")).toBe(true);
    await click(b);
    expect(b.hasAttribute("aria-controls")).toBe(false);
  });

  test("a visible status word with a tone color, hidden from screen readers", async () => {
    const el = await mount(
      <Timeline
        items={(["failed", "warning", "running", "skipped", "done", "waiting"] as const).map((status) => ({ id: status, title: status, status }))}
      />,
    );
    const tone = { failed: "text-danger", warning: "text-warning", running: "text-fg-2", skipped: "text-fg-3" } as const;
    for (const [s, c] of Object.entries(tone)) {
      const w = el.querySelector(`li[data-status="${s}"] div span.ms-auto`)!;
      expect(w.className).toContain(c);
      expect(w.textContent).toBe(el.querySelector(`li[data-status="${s}"] .sr-only`)!.textContent);
    }
    expect(el.querySelector('li[data-status="done"] span.ms-auto')).toBeNull();
    expect(el.querySelector('li[data-status="waiting"] span.ms-auto')).toBeNull();
  });

  test("the onSelect title button is at least 24 px high", async () => {
    const el = await mount(<Timeline onSelect={() => {}} items={[{ id: "a", title: "Build" }]} />);
    expect(el.querySelector("button")!.className).toContain("min-h-6");
  });

  test("the line is primary when the next item is reached", async () => {
    const statuses = ["next", "running", "failed", "warning", "done", "current", "skipped", "waiting", "next"] as const;
    const el = await mount(<Timeline items={statuses.map((status, i) => ({ id: String(i), title: status, status }))} />);
    const lines = [...el.querySelectorAll("li")].slice(0, -1).map((li) => li.querySelector("span > span.w-px")!.className.includes("bg-primary"));
    expect(lines).toEqual([true, true, true, true, true, false, false, false]);
  });

  test("a next title is muted, a done title is not", async () => {
    const el = await mount(<Timeline items={[{ id: "a", title: "A", status: "next" }, { id: "b", title: "B", status: "done" }]} />);
    const t = (s: string) => el.querySelector(`li[data-status="${s}"] .font-medium`)!.className;
    expect(t("next")).toContain("text-fg-3");
    expect(t("done")).toContain("text-fg");
    expect(t("done")).not.toContain("text-fg-3");
  });
});
