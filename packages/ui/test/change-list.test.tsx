import { describe, expect, test } from "bun:test";
import { ChangeList } from "../src/components/change-list";
import { STRINGS } from "../src/i18n/strings";
import { PercentProvider } from "../src/provider";
import { mount, useDom } from "./dom";

useDom();

describe("ChangeList", () => {
  test("each item shows label, before and after", async () => {
    const el = await mount(<ChangeList items={[{ label: "Port", before: "80", after: "8080" }]} />);
    const row = el.querySelector("[data-change]")!;
    expect(row.textContent).toContain("Port");
    expect(row.querySelector("[data-before]")!.textContent).toBe("from80");
    expect(row.querySelector("[data-after]")!.textContent).toBe("to8080");
    expect(row.querySelector("[data-before]")!.className.split(" ")).toContain("text-fg-3");
    expect(row.querySelector("[data-after]")!.className.split(" ")).toContain("text-fg");
    const sr = [...row.querySelectorAll(".sr-only")].map((n) => n.textContent);
    expect(sr).toEqual(["from", "to"]);
    const arrow = row.querySelector("svg")!;
    expect(arrow.getAttribute("aria-hidden")).toBe("true");
    expect(arrow.getAttribute("class")).toContain("rtl:-scale-x-100");
  });

  test("empty before or after shows Not set", async () => {
    const el = await mount(
      <ChangeList items={[{ label: "A", before: "", after: "x" }, { label: "B", before: "y", after: null }]} />,
    );
    expect(el.textContent?.match(/Not set/g)).toHaveLength(2);
  });

  test("hidden item shows no values", async () => {
    const el = await mount(<ChangeList items={[{ label: "Token", before: "old-secret", after: "new-secret", hidden: true }]} />);
    expect(el.textContent).not.toContain("old-secret");
    expect(el.textContent).not.toContain("new-secret");
    expect(el.textContent).toContain("Changed (value hidden)");
  });

  test("groups give headings in the order of the first item", async () => {
    const el = await mount(
      <ChangeList
        items={[
          { label: "A", before: "1", after: "2", group: "Main website" },
          { label: "B", before: "1", after: "2", group: "Shop" },
          { label: "C", before: "1", after: "2", group: "Main website" },
        ]}
      />,
    );
    const heads = [...el.querySelectorAll("[data-group]")].map((n) => n.textContent);
    expect(heads).toEqual(["Main website", "Shop"]);
    expect(el.querySelectorAll("[data-change]")).toHaveLength(3);
  });

  test("compact shows one line with the count and labels, no values", async () => {
    const el = await mount(
      <ChangeList
        compact
        items={[
          { label: "Name", before: "a", after: "b" },
          { label: "Port", before: "c", after: "d" },
          { label: "Memory", before: "e", after: "f" },
        ]}
      />,
    );
    expect(el.textContent).toBe("3 changes: Name, Port, Memory");
    expect(el.innerHTML).toContain("truncate");
  });

  test("compact with one item says 1 change", async () => {
    const el = await mount(<ChangeList compact items={[{ label: "Name", before: "a", after: "b" }]} />);
    expect(el.textContent).toBe("1 change: Name");
  });

  test("note shows below the list", async () => {
    const el = await mount(<ChangeList items={[{ label: "A", before: "1", after: "2" }]} note="Restart needed" />);
    const note = el.querySelector("[data-note]")!;
    expect(note.textContent).toBe("Restart needed");
    expect(note.previousElementSibling!.querySelector("[data-change]")).not.toBeNull();
    expect(note.nextElementSibling).toBeNull();
  });

  test("on a phone before and after stack under the label", async () => {
    const el = await mount(<ChangeList items={[{ label: "A", before: "1", after: "2" }]} />);
    expect(el.querySelector("[data-change]")!.className).toContain("max-md:grid");
  });

  test("long values break", async () => {
    const el = await mount(<ChangeList items={[{ label: "A", before: "x".repeat(80), after: "y".repeat(80) }]} />);
    for (const k of ["before", "after"]) {
      const c = el.querySelector(`[data-${k}]`)!.className.split(" ");
      expect(c).toContain("min-w-0");
      expect(c).toContain("break-all");
    }
  });

  test("the list separator comes from strings", async () => {
    const items = [{ label: "A", before: "1", after: "2" }, { label: "B", before: "1", after: "2" }];
    const el = await mount(<ChangeList compact items={items} />);
    expect(el.textContent).toBe("2 changes: A, B");
    const ar = await mount(<PercentProvider lang="ar"><ChangeList compact items={items} /></PercentProvider>);
    expect(ar.textContent).toBe("تغييران: A، B");
  });

  test("zero items show No changes, full and compact", async () => {
    const a = await mount(<ChangeList items={[]} />);
    expect(a.textContent).toBe("No changes");
    const b = await mount(<ChangeList compact items={[]} />);
    expect(b.textContent).toBe("No changes");
    expect(STRINGS.ar.noChanges).toBe("لا تغييرات");
  });

  test("Arabic change count forms", () => {
    const f = STRINGS.ar.changeCount;
    expect([1, 2, 3, 10, 11, 25, 100, 102].map(f)).toEqual(["تغيير واحد", "تغييران", "3 تغييرات", "10 تغييرات", "11 تغييرًا", "25 تغييرًا", "100 تغيير", "102 تغيير"]);
    expect(STRINGS.en.changeCount(1)).toBe("1 change");
    expect(STRINGS.en.changeCount(4)).toBe("4 changes");
  });
});

describe("values keep their word order", () => {
  test("each before and after value is in a bdi", async () => {
    const el = await mount(<ChangeList items={[{ label: "Memory", before: "512 MB", after: "1 GB" }]} />);
    expect(el.querySelector("[data-before] bdi")!.textContent).toBe("512 MB");
    expect(el.querySelector("[data-after] bdi")!.textContent).toBe("1 GB");
  });
});
