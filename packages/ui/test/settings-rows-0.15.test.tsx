import { describe, expect, test } from "bun:test";
import { act, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { renderToStaticMarkup } from "react-dom/server";
import { Button, Checkbox, Input, List, ListItem, PercentProvider, SettingsRow, SettingsSection, Switch } from "../src";
import { FormSettingsRow } from "../src/react-hook-form";
import { click, mount, useDom } from "./dom";

useDom();

const wrap = (lang: "en" | "ar", node: ReactNode) => <PercentProvider lang={lang}>{node}</PercentProvider>;
const describedBy = (el: Element) => (el.getAttribute("aria-describedby") ?? "").split(" ").filter(Boolean).map((id) => document.getElementById(id)?.textContent);

describe("SettingsSection status", () => {
  test("shows at the start of the footer in a polite status region", () => {
    const html = renderToStaticMarkup(wrap("en", <SettingsSection title="POS" status="Unsaved changes" footer={<Button>Save</Button>}>x</SettingsSection>));
    expect(html).toContain('role="status"');
    expect(html.indexOf("Unsaved changes")).toBeLessThan(html.indexOf("Save"));
  });
  test("null keeps an empty region; no status keeps the old footer", () => {
    const empty = renderToStaticMarkup(wrap("en", <SettingsSection title="POS" status={null} footer={<Button>Save</Button>}>x</SettingsSection>));
    expect(empty).toContain('role="status"');
    const old = renderToStaticMarkup(wrap("en", <SettingsSection title="POS" footer={<Button>Save</Button>}>x</SettingsSection>));
    expect(old).not.toContain('role="status"');
    expect(old).toContain("justify-end");
  });
  test("status without footer shows nothing", () => {
    expect(renderToStaticMarkup(wrap("en", <SettingsSection title="POS" status="Saved">x</SettingsSection>))).not.toContain("Saved");
  });
});

describe("SettingsRow error, required, optional", () => {
  test("the error links to the control and marks it invalid, in both languages", async () => {
    for (const [lang, label, err] of [["en", "Period", "Too long"], ["ar", "المهلة", "طويلة جدًا"]] as const) {
      await mount(wrap(lang, <SettingsRow label={label} description="Days" controlId={`p-${lang}`} error={err} required optional control={<Input id={`p-${lang}`} />} />));
    }
    for (const lang of ["en", "ar"]) {
      const input = document.getElementById(`p-${lang}`)!;
      expect(input.getAttribute("aria-invalid")).toBe("true");
      expect(input.hasAttribute("required")).toBe(true);
      expect(describedBy(input)).toEqual(["Days", lang === "en" ? "Too long" : "طويلة جدًا"]);
      const label = document.querySelector(`label[for="p-${lang}"]`)!;
      expect(label.textContent).toContain(" *");
      expect(label.textContent).toContain(lang === "en" ? "Optional" : "اختياري");
    }
    expect(document.querySelector('[role="alert"]')).toBeNull();
  });
  test("without an error nothing changes", async () => {
    await mount(wrap("en", <SettingsRow label="A" controlId="a" control={<Input id="a" />} />));
    const input = document.getElementById("a")!;
    expect(input.getAttribute("aria-invalid")).toBeNull();
    expect(input.getAttribute("aria-describedby")).toBeNull();
    expect(document.querySelector('[role="alert"]')).toBeNull();
  });
  test("a group row names its error", async () => {
    await mount(wrap("en", <SettingsRow label="Alerts" description="Where" error="Pick one" control={<Switch label="Email" />} />));
    const group = document.querySelector('[role="group"]')!;
    expect(describedBy(group)).toEqual(["Where", "Pick one"]);
  });
});

describe("FormSettingsRow", () => {
  function Form({ lang }: { lang: "en" | "ar" }) {
    const { control, handleSubmit } = useForm({ defaultValues: { days: "" } });
    return (
      <PercentProvider lang={lang}>
        <form onSubmit={handleSubmit(() => {})}>
          <FormSettingsRow control={control} name="days" label="Days" description="Return period" required rules={{ required: lang === "en" ? "Required" : "مطلوب" }} render={({ field }) => <Input {...field} />} />
        </form>
      </PercentProvider>
    );
  }
  for (const lang of ["en", "ar"] as const) {
    test(`a failed submit shows the error and wires the control (${lang})`, async () => {
      await mount(<Form lang={lang} />);
      const input = document.querySelector("input")!;
      expect(input.getAttribute("aria-invalid")).toBeNull();
      expect(document.querySelector(`label[for="${input.id}"]`)?.textContent).toContain("Days");
      await act(async () => {
        document.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      });
      expect(input.getAttribute("aria-invalid")).toBe("true");
      expect(describedBy(input)).toEqual(["Return period", lang === "en" ? "Required" : "مطلوب"]);
    });
  }
  test("group: a Switch in the row is named by the label and the error is in the group description", async () => {
    function G() {
      const { control, handleSubmit } = useForm({ defaultValues: { on: false } });
      return (
        <PercentProvider lang="en">
          <form onSubmit={handleSubmit(() => {})}>
            <FormSettingsRow group control={control} name="on" label="Alerts" rules={{ validate: (v) => v || "Turn on" }} render={({ field }) => <Switch label="Email" checked={field.value} onCheckedChange={field.onChange} />} />
          </form>
        </PercentProvider>
      );
    }
    await mount(<G />);
    await act(async () => {
      document.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    const group = document.querySelector('[role="group"]')!;
    expect(describedBy(group)).toEqual(["Turn on"]);
    expect(document.querySelector("label[for]")).toBeNull();
  });
  test("a Checkbox in a group SettingsRow", async () => {
    await mount(wrap("en", <SettingsRow label="Terms" error="Accept" control={<Checkbox label="I accept" />} />));
    expect(describedBy(document.querySelector('[role="group"]')!)).toEqual(["Accept"]);
  });
});

describe("ListItem move", () => {
  function Ordered({ lang, start = ["Alpha", "Beta", "Gamma"] }: { lang: "en" | "ar"; start?: string[] }) {
    const [rows, setRows] = useState(start);
    return (
      <PercentProvider lang={lang}>
        <List>
          {rows.map((r, i) => (
            <ListItem
              key={r}
              title={r}
              move={{
                index: i,
                count: rows.length,
                onMove: (from, to) =>
                  setRows((x) => {
                    const n = [...x];
                    n.splice(to, 0, ...n.splice(from, 1));
                    return n;
                  }),
              }}
            />
          ))}
        </List>
      </PercentProvider>
    );
  }
  const btn = (name: string) => document.querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)!;
  const status = () => [...document.querySelectorAll('[role="status"]')].map((e) => e.textContent).filter(Boolean);

  test("names and disabled ends, English and Arabic", async () => {
    await mount(<Ordered lang="en" />);
    expect(btn("Move Alpha up").disabled).toBe(true);
    expect(btn("Move Alpha down").disabled).toBe(false);
    expect(btn("Move Gamma down").disabled).toBe(true);
    document.body.innerHTML = "";
    await mount(<Ordered lang="ar" start={["أ", "ب"]} />);
    expect(btn("نقل أ للأعلى").disabled).toBe(true);
    expect(btn("نقل ب للأسفل").disabled).toBe(true);
    expect(btn("نقل أ للأسفل").disabled).toBe(false);
  });
  test("a move reorders, keeps the focus on the same button and announces", async () => {
    await mount(<Ordered lang="en" />);
    const down = btn("Move Beta down");
    down.focus();
    await click(down);
    const titles = [...document.querySelectorAll("li")].map((li) => li.querySelector("button")!.getAttribute("aria-label"));
    expect(titles[2]).toBe("Move Beta up");
    expect(document.activeElement).toBe(btn("Move Beta up"));
    expect(status()).toEqual(["Moved Beta to position 3 of 3"]);
  });
  test("the focus stays on the same button in the middle", async () => {
    await mount(<Ordered lang="en" start={["A", "B", "C", "D"]} />);
    const up = btn("Move C up");
    up.focus();
    await click(up);
    expect(document.activeElement).toBe(btn("Move C up"));
    expect(status()).toEqual(["Moved C to position 2 of 4"]);
  });
  test("a row at an end passes the focus to the other button; Arabic announcement", async () => {
    await mount(<Ordered lang="ar" start={["أ", "ب", "ج"]} />);
    const up = btn("نقل ب للأعلى");
    up.focus();
    await click(up);
    expect(document.activeElement).toBe(btn("نقل ب للأسفل"));
    expect(status()).toEqual(["نُقل ب إلى الموضع 1 من 3"]);
  });
  test("one live region for the list keeps the last message", async () => {
    await mount(<Ordered lang="en" start={["A", "B", "C"]} />);
    await click(btn("Move A down"));
    await click(btn("Move A down"));
    expect(document.querySelectorAll('[role="status"]').length).toBe(1);
    expect(status()).toEqual(["Moved A to position 3 of 3"]);
  });
  test("a refused move does not steal the focus or announce later", async () => {
    function Refuse() {
      const [rows, setRows] = useState(["A", "B", "C"]);
      const [refuse, setRefuse] = useState(true);
      const swap = (from: number, to: number) =>
        setRows((x) => {
          const n = [...x];
          n.splice(to, 0, ...n.splice(from, 1));
          return n;
        });
      return (
        <PercentProvider lang="en">
          <button onClick={() => setRefuse(false)}>allow</button>
          <List>
            {rows.map((r, i) => (
              <ListItem key={r} title={r} move={{ index: i, count: 3, onMove: (from, to) => !(refuse && r === "A") && swap(from, to) }} />
            ))}
          </List>
        </PercentProvider>
      );
    }
    await mount(<Refuse />);
    await click(btn("Move A down")); // refused: A stays at index 0
    const now = Date.now;
    Date.now = () => now() + 5000;
    await click(btn("Move B up")); // B moves to index 0, A to index 1 = A's stale target
    Date.now = now;
    expect(status()).toEqual(["Moved B to position 1 of 3"]);
  });
  test("a row without move is unchanged", () => {
    const html = renderToStaticMarkup(wrap("en", <ListItem title="Plain" />));
    expect(html).not.toContain("<button");
  });
});
