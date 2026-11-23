// Autocomplete: a text input with suggestions (0.20.0).
import { describe, expect, test } from "bun:test";
import { act, useState } from "react";
import { useForm } from "react-hook-form";
import { Autocomplete, Dialog, PercentProvider, type AutocompleteSuggestion } from "../src";
import { boldRange, matchSuggestions } from "../src/components/autocomplete-match";
import { FormField } from "../src/react-hook-form";
import { click, mount, press, useDom } from "./dom";

useDom();

const type = (input: HTMLInputElement, value: string) =>
  act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
const input = () => document.querySelector<HTMLInputElement>('[role="combobox"]')!;
const optionTexts = () => [...document.querySelectorAll('[role="option"]')].map((o) => o.textContent);
const highlighted = () => document.getElementById(input().getAttribute("aria-activedescendant") ?? "")?.textContent ?? null;
const list = () => document.querySelector('[role="listbox"]');
const wait = (ms: number) => act(async () => void (await new Promise((r) => setTimeout(r, ms))));

const BRANCHES: AutocompleteSuggestion[] = [{ value: "main" }, { value: "feature/login" }];

/** Controlled wrapper; `values` records every onValueChange. */
function Box({ values = [], initial = "", ...props }: Partial<React.ComponentProps<typeof Autocomplete>> & { values?: string[]; initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <Autocomplete
      aria-label="Branch"
      suggestions={BRANCHES}
      {...props}
      value={value}
      onValueChange={(v) => {
        values.push(v);
        setValue(v);
      }}
    />
  );
}

describe("Autocomplete", () => {
  test("typing filters by searchKey and keeps the text", async () => {
    const values: string[] = [];
    await mount(<Box values={values} />);
    await type(input(), "FEA");
    expect(optionTexts()).toEqual(["feature/login"]);
    expect(values.at(-1)).toBe("FEA");
  });

  test("no row is highlighted until Down; Down wraps; typing clears the highlight", async () => {
    await mount(<Box />);
    await type(input(), "a");
    expect(input().getAttribute("aria-activedescendant")).toBeNull();
    await press(input(), { key: "ArrowDown" });
    expect(highlighted()).toBe("main");
    await press(input(), { key: "ArrowDown" });
    expect(highlighted()).toBe("feature/login");
    await press(input(), { key: "ArrowDown" });
    expect(highlighted()).toBe("main");
    await type(input(), "ai");
    expect(input().getAttribute("aria-activedescendant")).toBeNull();
  });

  test("Down and Alt+Down on a closed list open it", async () => {
    await mount(<Box />);
    expect(list()).toBeNull();
    await press(input(), { key: "ArrowDown" });
    expect(input().getAttribute("aria-expanded")).toBe("true");
    expect(highlighted()).toBe("main");
    await press(input(), { key: "Escape" });
    expect(list()).toBeNull();
    await press(input(), { key: "ArrowDown", altKey: true });
    expect(input().getAttribute("aria-expanded")).toBe("true");
    expect(input().getAttribute("aria-activedescendant")).toBeNull();
  });

  test("Enter with no highlight is not prevented", async () => {
    const values: string[] = [];
    await mount(<Box values={values} />);
    await type(input(), "fe");
    const e = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    await act(async () => void input().dispatchEvent(e));
    expect(e.defaultPrevented).toBe(false);
    expect(values).toEqual(["fe"]);
  });

  test("Enter on a highlighted row fills it and is prevented", async () => {
    await mount(<Box />);
    await press(input(), { key: "ArrowDown" });
    const e = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    await act(async () => void input().dispatchEvent(e));
    expect(e.defaultPrevented).toBe(true);
    expect(input().value).toBe("main");
    expect(list()).toBeNull();
  });

  test("Enter during composition is not touched", async () => {
    await mount(<Box />);
    await press(input(), { key: "ArrowDown" });
    const e = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true, isComposing: true });
    await act(async () => void input().dispatchEvent(e));
    expect(e.defaultPrevented).toBe(false);
    expect(input().value).toBe("");
  });

  test("Escape closes the list and keeps the text", async () => {
    await mount(<Box />);
    await type(input(), "ma");
    await press(input(), { key: "Escape" });
    expect(list()).toBeNull();
    expect(input().value).toBe("ma");
  });

  test("Escape in a dialog closes only the list", async () => {
    await mount(
      <Dialog defaultOpen title="Deploy">
        <Box />
      </Dialog>,
    );
    await press(input(), { key: "ArrowDown" });
    expect(list()).not.toBeNull();
    await press(input(), { key: "Escape" });
    expect(list()).toBeNull();
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
  });

  test("Tab closes the list and fills nothing", async () => {
    await mount(<Box />);
    await press(input(), { key: "ArrowDown" });
    await press(input(), { key: "Tab" });
    expect(list()).toBeNull();
    expect(input().value).toBe("");
  });

  test("openOnFocus opens after a pointer press or Tab, not on a programmatic focus", async () => {
    await mount(<Box openOnFocus />);
    await act(async () => void input().focus());
    expect(list()).toBeNull();
    await act(async () => void input().blur());
    await act(async () => {
      input().dispatchEvent(new Event("pointerdown", { bubbles: true }));
      input().focus();
    });
    expect(list()).not.toBeNull();
    await act(async () => void input().blur());
    await press(input(), { key: "Escape" });
    expect(list()).toBeNull();
    await act(async () => {
      document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
      input().focus();
    });
    expect(list()).not.toBeNull();
  });

  test("without openOnFocus a pointer press does not open the list", async () => {
    await mount(<Box />);
    await act(async () => {
      input().dispatchEvent(new Event("pointerdown", { bubbles: true }));
      input().focus();
    });
    expect(list()).toBeNull();
  });

  test("a label shows and the value fills", async () => {
    const hash = "a".repeat(40);
    const row = { value: hash, label: "a1b2c3d Fix login", detail: "2 h ago" };
    const picked: AutocompleteSuggestion[] = [];
    await mount(<Box suggestions={[row]} onSuggestionSelect={(s) => picked.push(s)} />);
    await press(input(), { key: "ArrowDown" });
    expect(optionTexts()).toEqual(["a1b2c3d Fix login2 h ago"]);
    await click(document.querySelector('[role="option"]')!);
    expect(input().value).toBe(hash);
    expect(picked).toEqual([row]);
  });

  test("token replaces only its part and moves the cursor", async () => {
    const rows = [{ value: "cache-redis1-shop:6379" }];
    await mount(<Box initial="redis://:pw@cache-" suggestions={rows} token={() => ({ start: 12, end: 18 })} />);
    await press(input(), { key: "ArrowDown" });
    expect(optionTexts()).toEqual(["cache-redis1-shop:6379"]);
    await press(input(), { key: "Enter" });
    expect(input().value).toBe("redis://:pw@cache-redis1-shop:6379");
    expect(input().selectionStart).toBe(34);
  });

  test("a token that returns null shows no list", async () => {
    await mount(<Box initial="x" token={() => null} />);
    await press(input(), { key: "ArrowDown" });
    expect(list()).toBeNull();
  });

  test("loading shows Searching and aria-busy", async () => {
    await mount(<Box suggestions={[]} loading />);
    await press(input(), { key: "ArrowDown", altKey: true });
    expect(list()!.getAttribute("aria-busy")).toBe("true");
    expect(list()!.textContent).toBe("Searching");
  });

  test("unavailable shows the design system text", async () => {
    await mount(<Box unavailable />);
    await type(input(), "x");
    expect(list()!.textContent).toBe("Suggestions are not available now. You can still type the value.");
  });
  test("an unavailable string replaces the text", async () => {
    await mount(<Box unavailable="X" />);
    await type(input(), "x");
    expect(list()!.textContent).toBe("X");
  });
  test("emptyText shows when nothing matches", async () => {
    await mount(<Box emptyText="E" />);
    await type(input(), "zzz");
    expect(list()!.textContent).toBe("E");
  });
  test("no match without emptyText: no list", async () => {
    await mount(<Box />);
    await type(input(), "zzz");
    expect(list()).toBeNull();
  });
  test("Arabic status text", async () => {
    await mount(
      <PercentProvider lang="ar">
        <Box unavailable />
      </PercentProvider>,
    );
    await type(input(), "x");
    expect(list()!.textContent).toBe("الاقتراحات غير متاحة الآن. يمكنك كتابة القيمة بنفسك.");
  });

  test("the live region says the result", async () => {
    await mount(<Box />);
    await type(input(), "a");
    await wait(450);
    expect(document.querySelector('[role="status"]')!.textContent).toBe("2 suggestions");
    await type(input(), "zzz");
    await wait(450);
    expect(document.querySelector('[role="status"]')!.textContent).toBe("No suggestions");
  });

  test("the live region in Arabic", async () => {
    await mount(
      <PercentProvider lang="ar">
        <Box />
      </PercentProvider>,
    );
    await type(input(), "a");
    await wait(450);
    expect(document.querySelector('[role="status"]')!.textContent).toBe("عدد الاقتراحات: 2");
  });

  test("limit shows the narrow row", async () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({ value: `item-${i}` }));
    await mount(<Box suggestions={rows} />);
    await type(input(), "item");
    expect(document.querySelectorAll('[role="option"]').length).toBe(8);
    expect(list()!.textContent).toContain("2 more. Type to narrow the list.");
  });

  test("onQueryChange gets the query and rows show as given", async () => {
    const queries: string[] = [];
    await mount(<Box suggestions={[{ value: "other" }]} onQueryChange={(q) => queries.push(q)} />);
    await type(input(), "zz");
    expect(queries).toEqual(["zz"]);
    expect(optionTexts()).toEqual(["other"]);
  });

  test("mono sets the text direction and turns off corrections", async () => {
    await mount(<Box mono />);
    const el = input();
    expect([el.getAttribute("dir"), el.getAttribute("autocapitalize"), el.getAttribute("autocorrect"), el.getAttribute("spellcheck")]).toEqual(["ltr", "none", "off", "false"]);
  });

  test("FormField focuses the Autocomplete on a submit error", async () => {
    function Required() {
      const { control, handleSubmit } = useForm({ defaultValues: { branch: "" } });
      return (
        <form onSubmit={handleSubmit(() => {})}>
          <FormField
            control={control}
            name="branch"
            label="Branch"
            rules={{ required: "Required" }}
            render={({ field }) => <Autocomplete {...field} suggestions={BRANCHES} onValueChange={field.onChange} />}
          />
        </form>
      );
    }
    await mount(<Required />);
    await act(async () => void document.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
    expect(document.activeElement).toBe(input());
    expect(input().getAttribute("aria-invalid")).toBe("true");
  });
});

describe("Autocomplete fixes", () => {
  test("a choice that keeps the text leaves no pending cursor", async () => {
    await mount(<Box />);
    await type(input(), "main");
    await press(input(), { key: "ArrowDown" });
    await press(input(), { key: "Enter" });
    expect(input().value).toBe("main");
    await type(input(), "mainx");
    expect(input().value).toBe("mainx");
    expect(input().selectionStart).toBe(5);
  });

  test("openOnFocus: a focus that follows Tab elsewhere does not open", async () => {
    await mount(
      <>
        <button>Edit</button>
        <Box openOnFocus />
      </>,
    );
    await act(async () => {
      document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
      document.querySelector("button")!.focus();
    });
    await act(async () => void input().focus());
    expect(list()).toBeNull();
  });

  test("openOnFocus: a press on the label opens the list", async () => {
    await mount(
      <>
        <label htmlFor="b">Branch</label>
        <Box id="b" openOnFocus />
      </>,
    );
    await act(async () => {
      document.querySelector("label")!.dispatchEvent(new Event("pointerdown", { bubbles: true }));
      input().focus();
    });
    expect(list()).not.toBeNull();
  });

  const status = () => document.querySelector('[role="status"]')!.textContent;
  test("the live region is empty when token gives no range", async () => {
    await mount(<Box initial="x" token={() => null} />);
    await press(input(), { key: "ArrowDown" });
    await type(input(), "xy");
    await wait(450);
    expect(status()).toBe("");
  });

  test("the live region is empty while loading", async () => {
    await mount(<Box loading />);
    await type(input(), "a");
    await wait(450);
    expect(status()).toBe("");
  });

  test("the live region is empty before the person acts", async () => {
    await mount(<Box />);
    await wait(450);
    expect(status()).toBe("");
  });

  test("openOnFocus: a press on a plain element, then a focus, does not open", async () => {
    await mount(
      <>
        <div id="card">Card</div>
        <Box openOnFocus />
      </>,
    );
    await act(async () => {
      document.getElementById("card")!.dispatchEvent(new Event("pointerdown", { bubbles: true }));
      input().focus();
    });
    expect(list()).toBeNull();
  });

  test("openOnFocus: a cancelled press clears the flag, so a later focus does not open", async () => {
    await mount(<Box openOnFocus />);
    await act(async () => {
      input().dispatchEvent(new Event("pointerdown", { bubbles: true }));
      document.dispatchEvent(new Event("pointercancel", { bubbles: true }));
      input().focus();
    });
    expect(list()).toBeNull();
  });

  test("openOnFocus: a press inside the focused input does not open on a later focus", async () => {
    await mount(<Box openOnFocus />);
    await act(async () => {
      input().dispatchEvent(new Event("pointerdown", { bubbles: true }));
      input().focus();
    });
    expect(list()).not.toBeNull();
    await press(input(), { key: "Escape" });
    await act(async () => void input().dispatchEvent(new Event("pointerdown", { bubbles: true })));
    await act(async () => void input().blur());
    await act(async () => void input().focus());
    expect(list()).toBeNull();
  });

  test("after a choice, Down uses the new cursor", async () => {
    const token = (text: string, cursor: number) => ({ start: text.lastIndexOf(",", cursor - 1) + 1, end: cursor });
    await mount(<Box initial="x," token={token} />);
    await type(input(), "x,m");
    await press(input(), { key: "ArrowDown" });
    await press(input(), { key: "Enter" });
    expect(input().value).toBe("x,main");
    await press(input(), { key: "ArrowDown" });
    await press(input(), { key: "Enter" });
    expect(input().value).toBe("x,main");
  });

  test("rows have no extra end padding", async () => {
    await mount(<Box />);
    await press(input(), { key: "ArrowDown" });
    const cls = document.querySelector('[role="option"]')!.className;
    expect(cls).toContain("pe-3");
    expect(cls).not.toContain("pe-8");
  });

  test("Enter with keyCode 229 is not touched", async () => {
    await mount(<Box />);
    await press(input(), { key: "ArrowDown" });
    const e = new KeyboardEvent("keydown", { key: "Enter", keyCode: 229, bubbles: true, cancelable: true });
    await act(async () => void input().dispatchEvent(e));
    expect(e.defaultPrevented).toBe(false);
    expect(input().value).toBe("");
  });

  test("with mono the row value is left-to-right in the mono font", async () => {
    await mount(<Box mono />);
    await press(input(), { key: "ArrowDown" });
    const v = document.querySelector('[role="option"] span')!;
    expect(v.getAttribute("dir")).toBe("ltr");
    expect(v.className).toContain("font-mono");
  });
});

describe("autocomplete-match", () => {
  test("boldRange", () => {
    expect(boldRange("feature/login", "FEA")).toEqual([0, 3]);
    expect(boldRange("مدينة", "مد")).toBeNull();
    expect(boldRange("main", "x")).toBeNull();
  });
  test("matchSuggestions", () => {
    expect(matchSuggestions(BRANCHES, "")).toEqual(BRANCHES);
    expect(matchSuggestions([{ value: "h", label: "Riyadh" }], "RIY")).toHaveLength(1);
  });
});

describe("Autocomplete edge cases", () => {
  test("an undefined value does not crash and a row can be chosen", async () => {
    const values: string[] = [];
    await mount(<Autocomplete aria-label="Branch" suggestions={BRANCHES} value={undefined as unknown as string} onValueChange={(v) => values.push(v)} />);
    await press(input(), { key: "ArrowDown" });
    await press(input(), { key: "Enter" });
    expect(values).toEqual(["main"]);
  });

  test("with a text renderer the live region gets plain text", async () => {
    await mount(
      <PercentProvider lang="en" text={(s) => <span>{s}</span>}>
        <Box />
      </PercentProvider>,
    );
    await type(input(), "ma");
    await wait(450);
    expect(document.querySelector('[role="status"]')!.textContent).toBe("1 suggestion");
    expect(document.querySelector('[role="status"]')!.innerHTML).not.toContain("<span");
  });

  test("rows arriving after Down are not highlighted; Enter fills nothing", async () => {
    const values: string[] = [];
    let setRows: (r: AutocompleteSuggestion[]) => void = () => {};
    const App = () => {
      const [rows, set] = useState<AutocompleteSuggestion[]>([]);
      setRows = set;
      return <Box values={values} suggestions={rows} loading={rows.length === 0} onQueryChange={() => {}} />;
    };
    await mount(<App />);
    await type(input(), "m");
    await press(input(), { key: "Escape" });
    await press(input(), { key: "ArrowDown" });
    expect(input().getAttribute("aria-expanded")).toBe("true");
    await act(async () => setRows(BRANCHES));
    expect(input().getAttribute("aria-activedescendant")).toBeNull();
    const e = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    await act(async () => void input().dispatchEvent(e));
    expect(e.defaultPrevented).toBe(false);
    expect(values).toEqual(["m"]);
  });

  test("Down during composition does not open the list", async () => {
    await mount(<Box />);
    const e = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true, isComposing: true });
    await act(async () => void input().dispatchEvent(e));
    expect(e.defaultPrevented).toBe(false);
    expect(input().getAttribute("aria-expanded")).toBe("false");
    expect(input().getAttribute("aria-activedescendant")).toBeNull();
  });

  test("a readOnly input does not open or fill", async () => {
    const values: string[] = [];
    await mount(<Box readOnly values={values} />);
    await press(input(), { key: "ArrowDown" });
    await press(input(), { key: "Enter" });
    expect(input().getAttribute("aria-expanded")).toBe("false");
    expect(values).toEqual([]);
  });

  test("rows with the same value give no duplicate key warning", async () => {
    const errors: unknown[][] = [];
    const orig = console.error;
    console.error = (...a: unknown[]) => void errors.push(a);
    try {
      await mount(<Box suggestions={[{ value: "nginx", detail: "app A" }, { value: "nginx", detail: "app B" }]} />);
      await press(input(), { key: "ArrowDown" });
    } finally {
      console.error = orig;
    }
    expect(errors.filter((a) => String(a[0]).includes("same key"))).toEqual([]);
    expect(optionTexts()).toHaveLength(2);
  });

  test("a refused fill leaves no pending caret", async () => {
    const long = "a-very-long-branch-name";
    function Refuse() {
      const [v, setV] = useState("");
      return <Autocomplete aria-label="Branch" suggestions={[{ value: long }]} value={v} onValueChange={(n) => n.length <= 10 && setV(n)} />;
    }
    await mount(<Refuse />);
    await press(input(), { key: "ArrowDown" });
    await press(input(), { key: "Enter" });
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input(), "abc");
      input().setSelectionRange(1, 1);
      input().dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(input().selectionStart).toBe(1);
  });

  test("Enter with no highlight closes the list and is not prevented", async () => {
    await mount(<Box />);
    await type(input(), "fe");
    expect(input().getAttribute("aria-expanded")).toBe("true");
    const e = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
    await act(async () => void input().dispatchEvent(e));
    expect(e.defaultPrevented).toBe(false);
    expect(input().getAttribute("aria-expanded")).toBe("false");
  });

  test("a readOnly input with openOnFocus does not open or announce on Tab", async () => {
    await mount(<Box readOnly openOnFocus />);
    await act(async () => {
      document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
      input().focus();
    });
    await wait(450);
    expect(input().getAttribute("aria-expanded")).toBe("false");
    expect(document.querySelector('[role="status"]')!.textContent).toBe("");
  });
});

describe("Autocomplete start", () => {
  for (const lang of ["en", "ar"] as const) {
    test(`with start the list anchors to the field box, not the inner input (${lang})`, async () => {
      const proto = HTMLElement.prototype;
      const own = Object.getOwnPropertyDescriptor(proto, "getBoundingClientRect");
      // The box (div) is 300 wide; the inner input is 200 wide.
      proto.getBoundingClientRect = function (this: HTMLElement) {
        const w = this.tagName === "INPUT" ? 200 : this.tagName === "DIV" ? 300 : 0;
        return { x: 0, y: 0, left: 0, top: 0, right: w, bottom: 30, width: w, height: 30, toJSON() {} } as DOMRect;
      };
      try {
        await mount(
          <PercentProvider lang={lang}>
            <Box start={<span>i</span>} />
          </PercentProvider>,
        );
        await act(async () => input().focus());
        await type(input(), "m");
        await wait(30);
        const wrapper = document.querySelector<HTMLElement>("[data-radix-popper-content-wrapper]")!;
        expect(wrapper.style.getPropertyValue("--radix-popper-anchor-width")).toBe("300px");
      } finally {
        if (own) Object.defineProperty(proto, "getBoundingClientRect", own);
        else delete (proto as { getBoundingClientRect?: unknown }).getBoundingClientRect;
      }
    });
  }
});
