import { describe, expect, test } from "bun:test";
import { Timeline } from "../src/components/timeline";
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
    expect(li("skipped").innerHTML).toContain("text-fg-3");
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
});
