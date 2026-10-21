import { describe, expect, test } from "bun:test";
import { act, useState, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PercentProvider } from "../src";
import { Accordion } from "../src/components/accordion";
import { Avatar, AvatarGroup } from "../src/components/avatar";
import { initials } from "../src/lib/initials";
import { Stat } from "../src/components/stat";
import { Timeline } from "../src/components/timeline";
import { Tree, type TreeNode } from "../src/components/tree";
import { click, mount, press, useDom } from "./dom";

useDom();

const html = (node: ReactNode) => renderToStaticMarkup(node);
const ar = (node: ReactNode) => html(<PercentProvider lang="ar">{node}</PercentProvider>);

describe("Stat", () => {
  test("the change says its direction to screen readers; the value keeps its sign in Arabic", () => {
    const up = html(<Stat label="Revenue" value="1,200" change={{ value: "+12%", direction: "up" }} />);
    expect(up).toMatch(/class="sr-only">Increase/);
    expect(up).toMatch(/dir="ltr"[^>]*>\+12%</);
    expect(html(<Stat label="Users" value="80" change={{ value: "-3%", direction: "down" }} />)).toMatch(/sr-only">Decrease/);
    expect(html(<Stat label="Users" value="80" change={{ value: "0%", direction: "flat" }} />)).toMatch(/sr-only">No change/);
    expect(ar(<Stat label="الإيراد" value="1,200" change={{ value: "+12%", direction: "up" }} />)).toContain("زيادة");
    expect(ar(<Stat label="المستخدمون" value="80" change={{ value: "-3%", direction: "down" }} />)).toContain("إنقاص");
    expect(ar(<Stat label="المستخدمون" value="80" change={{ value: "0%", direction: "flat" }} />)).toContain("بلا تغيير");
  });
  test("arrows are neutral unless tone is danger; hint and chart slot render", () => {
    const neutral = html(<Stat label="Churn" value="2%" change={{ value: "+1%", direction: "up" }} hint="vs last month" chart={<i>chart</i>} />);
    expect(neutral).not.toContain("text-danger");
    expect(neutral).toContain("vs last month");
    expect(neutral).toContain("<i>chart</i>");
    expect(html(<Stat label="Churn" value="2%" change={{ value: "+1%", direction: "up", tone: "danger" }} />)).toContain("text-danger");
  });
});

describe("Timeline", () => {
  const items = [
    { id: "a", time: "09:00", title: "Order placed", status: "done" as const },
    { id: "b", time: "10:00", title: "Packed", description: "Riyadh warehouse", status: "current" as const },
    { id: "c", time: "12:00", title: "Delivered", status: "next" as const },
  ];
  test("an ordered list; the current item is marked; each status has its own look", () => {
    const out = html(<Timeline items={items} />);
    expect(out).toContain("<ol");
    expect(out.match(/<li/g)).toHaveLength(3);
    expect(out).toMatch(/data-status="current"[^>]*aria-current="step"|aria-current="step"[^>]*data-status="current"/);
    expect(out.match(/aria-current/g)).toHaveLength(1);
    expect(out).toContain('data-status="done"');
    expect(out).toContain('data-status="next"');
    expect(out).toContain("Riyadh warehouse");
    // The line between dots reaches only up to the current item.
    expect(out.match(/w-px flex-1 bg-primary"/g)).toHaveLength(1);
    expect(out.match(/w-px flex-1 bg-line-strong"/g)).toHaveLength(1);
  });
  test("renders in Arabic with the line on the start side", () => {
    const out = ar(<Timeline items={[{ id: "a", time: "٩", title: "تم الطلب" }]} />);
    expect(out).toContain("تم الطلب");
    expect(out).not.toMatch(/\b(left|right|ml|mr|pl|pr)-/);
  });
});

describe("Accordion", () => {
  const items = [
    { value: "a", title: "Pricing", content: "From 5,000" },
    { value: "b", title: "Timeline", content: "Six weeks" },
    { value: "c", title: "Support", content: "One year", disabled: true },
  ];
  const triggers = (el: Element) => [...el.querySelectorAll<HTMLButtonElement>("button")];

  test("single: one item open at a time, and the open item can close", async () => {
    const el = await mount(<Accordion items={items} />);
    const [a, b] = triggers(el);
    await click(a!);
    expect(a!.getAttribute("aria-expanded")).toBe("true");
    await click(b!);
    expect(a!.getAttribute("aria-expanded")).toBe("false");
    expect(b!.getAttribute("aria-expanded")).toBe("true");
    await click(b!);
    expect(b!.getAttribute("aria-expanded")).toBe("false");
    expect(triggers(el)[2]!.disabled).toBe(true);
  });
  test("multiple: several items open; onValueChange gets the list", async () => {
    let value: string[] = [];
    const el = await mount(<Accordion type="multiple" items={items} onValueChange={(v) => (value = v)} />);
    const [a, b] = triggers(el);
    await click(a!);
    await click(b!);
    expect(a!.getAttribute("aria-expanded")).toBe("true");
    expect(b!.getAttribute("aria-expanded")).toBe("true");
    expect(value).toEqual(["a", "b"]);
  });
  test("keyboard: arrows, Home and End move between headers (disabled items are skipped)", async () => {
    const el = await mount(<Accordion items={items} />);
    const [a, b] = triggers(el);
    await act(async () => a!.focus());
    await press(a!, { key: "ArrowDown" });
    expect(document.activeElement).toBe(b!);
    await press(b!, { key: "ArrowDown" });
    expect(document.activeElement).toBe(a!);
    await press(a!, { key: "End" });
    expect(document.activeElement).toBe(b!);
    await press(b!, { key: "Home" });
    expect(document.activeElement).toBe(a!);
  });
  test("defaultValue opens an item on the server; headers are h3 buttons", () => {
    const out = html(<Accordion items={items} defaultValue="b" />);
    expect(out).toMatch(/<h3[^>]*><button[^>]*aria-expanded="false"/);
    expect(out).toMatch(/aria-expanded="true"[^>]*>[\s\S]*Timeline/);
    expect(out).toContain("Six weeks");
  });
});

describe("Tree", () => {
  const items: TreeNode[] = [
    {
      id: "docs",
      label: "Documents",
      children: [
        { id: "cv", label: "CV.pdf" },
        { id: "tax", label: "Tax", children: [{ id: "2026", label: "2026.pdf" }] },
      ],
    },
    { id: "photos", label: "Photos" },
  ];
  const nodes = () => [...document.querySelectorAll<HTMLElement>('[role="treeitem"]')];
  const node = (id: string) => nodes().find((n) => n.dataset.id === id)!;
  const key = async (k: string) => press(document.activeElement!, { key: k });
  async function setup(lang: "en" | "ar" = "en", onSelect?: (id: string) => void) {
    await mount(
      <PercentProvider lang={lang}>
        <Tree aria-label="Files" items={items} onSelect={onSelect} />
      </PercentProvider>,
    );
    await act(async () => nodes()[0]!.focus());
  }

  test("server render: tree roles, levels, sizes, positions, one tab stop", () => {
    const out = html(<Tree aria-label="Files" items={items} defaultExpanded={["docs"]} />);
    expect(out).toMatch(/role="tree"[^>]*aria-label="Files"/);
    expect(out).toContain('role="group"');
    expect(out.match(/role="treeitem"/g)).toHaveLength(4);
    expect(out).toMatch(/aria-level="1" aria-setsize="2" aria-posinset="1"[^>]*aria-expanded="true"/);
    expect(out).toMatch(/aria-level="2" aria-setsize="2" aria-posinset="2"[^>]*aria-expanded="false"/);
    expect(out.match(/tabindex="0"/gi)).toHaveLength(1);
  });

  test("LTR keyboard: Right opens then enters, Left goes up then closes, Up/Down/Home/End", async () => {
    await setup();
    expect(node("docs").getAttribute("aria-expanded")).toBe("false");
    await key("ArrowRight");
    expect(node("docs").getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(node("docs"));
    await key("ArrowRight");
    expect(document.activeElement).toBe(node("cv"));
    await key("ArrowDown");
    expect(document.activeElement).toBe(node("tax"));
    await key("ArrowRight");
    await key("End");
    expect(document.activeElement).toBe(node("photos"));
    // Roving tabindex: only the focused node is in the tab order.
    expect(nodes().filter((n) => n.tabIndex === 0)).toEqual([node("photos")]);
    await key("ArrowUp");
    expect(document.activeElement).toBe(node("2026"));
    await key("ArrowLeft");
    expect(document.activeElement).toBe(node("tax"));
    await key("ArrowLeft");
    expect(node("tax").getAttribute("aria-expanded")).toBe("false");
    await key("Home");
    expect(document.activeElement).toBe(node("docs"));
    await key("ArrowLeft");
    expect(node("docs").getAttribute("aria-expanded")).toBe("false");
  });

  test("RTL keyboard: Left opens and enters, Right goes up and closes", async () => {
    await setup("ar");
    await key("ArrowLeft");
    expect(node("docs").getAttribute("aria-expanded")).toBe("true");
    await key("ArrowLeft");
    expect(document.activeElement).toBe(node("cv"));
    await key("ArrowRight");
    expect(document.activeElement).toBe(node("docs"));
    await key("ArrowRight");
    expect(node("docs").getAttribute("aria-expanded")).toBe("false");
  });

  test("Enter and Space select; a click selects and opens a parent", async () => {
    const picked: string[] = [];
    await setup("en", (id) => picked.push(id));
    await key("Enter");
    expect(node("docs").getAttribute("aria-selected")).toBe("true");
    await key("ArrowDown");
    await key(" ");
    expect(node("photos").getAttribute("aria-selected")).toBe("true");
    expect(node("docs").hasAttribute("aria-selected")).toBe(false);
    await click(node("docs").firstElementChild!);
    expect(node("docs").getAttribute("aria-expanded")).toBe("true");
    expect(picked).toEqual(["docs", "photos", "docs"]);
  });

  test("controlled expanded state", async () => {
    let last: string[] = [];
    function Controlled() {
      const [expanded, setExpanded] = useState<string[]>([]);
      return (
        <Tree
          aria-label="Files"
          items={items}
          expanded={expanded}
          onExpandedChange={(ids) => {
            last = ids;
            setExpanded(ids);
          }}
        />
      );
    }
    await mount(<Controlled />);
    await act(async () => nodes()[0]!.focus());
    await key("ArrowRight");
    expect(last).toEqual(["docs"]);
    expect(node("docs").getAttribute("aria-expanded")).toBe("true");
  });
});

describe("Avatar", () => {
  test("initials: first letters of the first two words, Latin in upper case, Arabic without the article", () => {
    expect(initials("sara ahmed")).toBe("SA");
    expect(initials("  John   Ronald Reuel ")).toBe("JR");
    expect(initials("Nora")).toBe("N");
    expect(initials("محمد العتيبي")).toBe("مع");
    expect(initials("ال")).toBe("ا");
    expect(initials("")).toBe("");
  });
  test("without an image it shows the initials and is named by the full name", () => {
    const out = html(<Avatar name="Sara Ahmed" src="/sara.jpg" />);
    expect(out).toMatch(/role="img"[^>]*aria-label="Sara Ahmed"/);
    expect(out).toContain(">SA<");
    expect(ar(<Avatar name="محمد العتيبي" size="lg" />)).toContain(">مع<");
  });
  test("AvatarGroup shows `max` avatars and a +N with a spoken label", () => {
    const people = ["Sara Ahmed", "Ali Hassan", "Nora Saleh", "Omar Fahd", "Lina Adel"];
    const group = (max?: number) => (
      <AvatarGroup max={max}>
        {people.map((p) => (
          <Avatar key={p} name={p} />
        ))}
      </AvatarGroup>
    );
    const out = html(group(3));
    expect(out.match(/role="img"/g)).toHaveLength(4);
    expect(out).toMatch(/aria-label="2 more"[^>]*>\+2</);
    expect(ar(group(3))).toContain('aria-label="عدد إضافي: 2"');
    expect(html(group())).not.toContain("more");
    expect(html(group(5))).not.toContain("more");
  });
});
