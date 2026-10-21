// Regression tests for the forms, layout and provider fixes of the 0.3.1 audit.
import { describe, expect, test } from "bun:test";
import { act, useState, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  ChoiceCardGroup,
  Combobox,
  DatePicker,
  Field,
  FileDrop,
  IbanInput,
  isSaudiIban,
  Link,
  MoneyInput,
  NationalAddress,
  NationalIdInput,
  NumberInput,
  OtpInput,
  PasswordInput,
  PercentProvider,
  SiteFooter,
  STRINGS,
  useStrings,
  type NationalAddressValue,
} from "../src";
import { click, mount, press, useDom } from "./dom";

useDom();
const noop = () => {};
const html = (node: ReactNode) => renderToStaticMarkup(node);

// Type like a person: the browser changes the text and the caret, then sends "input". The prototype setter skips React's value tracker.
const setText = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
async function edit(input: HTMLInputElement, text: string, caret = text.length) {
  await act(async () => {
    input.focus();
    setText.call(input, text);
    input.setSelectionRange(caret, caret);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("OtpInput keeps digits only", () => {
  const boxes = (el: HTMLElement) => [...el.querySelectorAll<HTMLInputElement>("input[data-radix-otp-input]")];
  const typeInFocused = async (ch: string) => edit(document.activeElement as HTMLInputElement, ch);

  test('typing "a", "1", "2": the letter is refused, focus moves on only for digits', async () => {
    const got: string[] = [];
    const el = await mount(<OtpInput length={4} onValueChange={(v) => got.push(v)} />);
    await act(async () => boxes(el)[0]!.focus());
    for (const ch of "a12") await typeInFocused(ch);
    expect(boxes(el).map((b) => b.value)).toEqual(["1", "2", "", ""]);
    expect(document.activeElement).toBe(boxes(el)[2]!);
    expect(got.every((v) => /^\d*$/.test(v))).toBe(true);
  });

  test("an Arabic digit becomes a Western digit", async () => {
    let value = "";
    const el = await mount(<OtpInput length={4} onValueChange={(v) => (value = v)} />);
    await act(async () => boxes(el)[0]!.focus());
    await typeInFocused("٣");
    expect(boxes(el)[0]!.value).toBe("3");
    expect(value).toBe("3");
  });

  test("a letter in the last box changes nothing", async () => {
    const el = await mount(<OtpInput length={2} defaultValue="12" />);
    await act(async () => boxes(el)[1]!.focus());
    await typeInFocused("x");
    expect(boxes(el).map((b) => b.value)).toEqual(["1", "2"]);
  });
  test("a key in a filled box with the caret after its digit: letters are refused, digits still go on", async () => {
    let value = "";
    const el = await mount(<OtpInput length={4} defaultValue="1" onValueChange={(v) => (value = v)} />);
    const first = boxes(el)[0]!;
    await act(async () => first.focus());
    first.setSelectionRange(1, 1);
    const e = new KeyboardEvent("keydown", { key: "a", bubbles: true, cancelable: true });
    await act(async () => first.dispatchEvent(e));
    expect(e.defaultPrevented).toBe(true);
    expect(boxes(el).map((b) => b.value)).toEqual(["1", "", "", ""]);
    const ctrlV = new KeyboardEvent("keydown", { key: "v", ctrlKey: true, bubbles: true, cancelable: true });
    await act(async () => first.dispatchEvent(ctrlV));
    expect(ctrlV.defaultPrevented).toBe(false);
    first.setSelectionRange(1, 1);
    await press(first, { key: "2" });
    expect(boxes(el)[1]!.value).toBe("2");
    expect(value).toBe("12");
  });

  test("a pasted code with Arabic digits, spaces and a dash fills the digits", async () => {
    let value = "";
    const el = await mount(<OtpInput length={6} onValueChange={(v) => (value = v)} />);
    await act(async () => {
      const e = new Event("paste", { bubbles: true, cancelable: true });
      Object.assign(e, { clipboardData: { getData: () => "٩٨ ٧-654" } });
      boxes(el)[0]!.dispatchEvent(e);
    });
    expect(value).toBe("987654");
  });

  test("inside a Field: the label names the group, the error describes it, the boxes are invalid", () => {
    const out = html(
      <Field label="Code" id="otp" error="Wrong code">
        <OtpInput length={2} />
      </Field>,
    );
    expect(out).toMatch(/role="group"[^>]*aria-labelledby="otp-label"|aria-labelledby="otp-label"[^>]*role="group"/);
    expect(out).toMatch(/aria-describedby="otp-error"/);
    expect(out.match(/<input[^>]*aria-invalid="true"/g)).toHaveLength(2);
    expect(out).toMatch(/<input[^>]*aria-label="Digit 1 of 2"[^>]*id="otp"/);
    expect(out).toContain("aria-invalid:border-danger");
  });
});

test("MoneyInput: the whole box is left to right in Arabic, so the Riyal sign is left of the number", async () => {
  const el = await mount(
    <PercentProvider lang="ar">
      <MoneyInput value="12" onValueChange={noop} />
    </PercentProvider>,
  );
  const box = el.querySelector("input")!.parentElement!;
  expect(box.className).toContain("[direction:ltr]");
  expect(box.firstElementChild!.querySelector("svg")).not.toBeNull();
});

test("Combobox and DatePicker: the hidden inputs follow disabled and form", () => {
  document.body.innerHTML =
    html(<Combobox options={[]} value="a" onValueChange={noop} name="city" form="f" disabled />) +
    html(<DatePicker value="2026-02-18" onValueChange={noop} name="day" form="f" disabled />);
  for (const name of ["city", "day"]) {
    const hidden = document.querySelector<HTMLInputElement>(`input[type="hidden"][name="${name}"]`)!;
    expect([hidden.disabled, hidden.getAttribute("form")]).toEqual([true, "f"]);
  }
});

describe("A full field refuses a typed character (keeps the old value and caret)", () => {
  function Controlled({ kind, initial }: { kind: "id" | "iban" | "money"; initial: string }) {
    const [v, setV] = useState(initial);
    if (kind === "id") return <NationalIdInput value={v} onValueChange={setV} />;
    if (kind === "iban") return <IbanInput value={v} onValueChange={setV} />;
    return <MoneyInput value={v} onValueChange={setV} />;
  }

  test('NationalIdInput "1010|123456" + "9" stays "1010123456", caret at 4', async () => {
    const input = (await mount(<Controlled kind="id" initial="1010123456" />)).querySelector("input")!;
    await edit(input, "10109123456", 5);
    expect(input.value).toBe("1010123456");
    expect(input.selectionStart).toBe(4);
  });

  test("IbanInput at 24 characters: a character typed in the middle is refused", async () => {
    const input = (await mount(<Controlled kind="iban" initial="SA0380000000608010167519" />)).querySelector("input")!;
    expect(input.value).toBe("SA03 8000 0000 6080 1016 7519");
    await edit(input, "SA03 89000 0000 6080 1016 7519", 7);
    expect(input.value).toBe("SA03 8000 0000 6080 1016 7519");
    expect(input.selectionStart).toBe(6);
  });

  test('MoneyInput "12.3|4" + "5" stays "12.34"', async () => {
    const input = (await mount(<Controlled kind="money" initial="12.34" />)).querySelector("input")!;
    await edit(input, "12.354", 5);
    expect(input.value).toBe("12.34");
    expect(input.selectionStart).toBe(4);
  });

  test("a letter in the middle is dropped and the caret stays (no limit reached)", async () => {
    const input = (await mount(<Controlled kind="id" initial="1010" />)).querySelector("input")!;
    await edit(input, "10a10", 3);
    expect(input.value).toBe("1010");
    expect(input.selectionStart).toBe(2);
  });
});

test("NationalAddress: a refused character in the middle keeps the caret there", async () => {
  function Address() {
    const [v, setV] = useState<NationalAddressValue>({ building: "12" });
    return <NationalAddress value={v} onValueChange={setV} />;
  }
  const el = await mount(<Address />);
  const building = el.querySelector<HTMLInputElement>('input[name="address.building"]')!;
  await edit(building, "1x2", 2);
  expect(building.value).toBe("12");
  expect(building.selectionStart).toBe(1);
});

describe("Combobox", () => {
  const CITIES = [
    { value: "ruh", label: "Riyadh" },
    { value: "jed", label: "Jeddah" },
  ];
  test("text cleared, then Enter: the value is cleared and the list closes", async () => {
    const got: string[] = [];
    await mount(<Combobox aria-label="City" options={CITIES} value="jed" onValueChange={(v) => got.push(v)} />);
    const input = document.querySelector<HTMLInputElement>('[role="combobox"]')!;
    await edit(input, "r");
    await edit(input, "");
    await press(input, { key: "Enter" });
    expect(got).toEqual([""]);
    expect(input.getAttribute("aria-expanded")).toBe("false");
  });
  test("no value, no text: Enter sends no change", async () => {
    const got: string[] = [];
    await mount(<Combobox aria-label="City" options={CITIES} value={null} onValueChange={(v) => got.push(v)} />);
    const input = document.querySelector<HTMLInputElement>('[role="combobox"]')!;
    await click(input);
    await press(input, { key: "Enter" });
    expect(got).toEqual([]);
  });
  test("ArrowDown then Enter still picks the highlighted item", async () => {
    const got: string[] = [];
    await mount(<Combobox aria-label="City" options={CITIES} value={null} onValueChange={(v) => got.push(v)} />);
    const input = document.querySelector<HTMLInputElement>('[role="combobox"]')!;
    await press(input, { key: "ArrowDown" });
    await press(input, { key: "Enter" });
    expect(got).toEqual(["ruh"]);
  });
  test("a mousedown anywhere on the list keeps focus in the input", async () => {
    await mount(<Combobox aria-label="City" options={CITIES} value={null} onValueChange={noop} />);
    const input = document.querySelector<HTMLInputElement>('[role="combobox"]')!;
    await press(input, { key: "ArrowDown" });
    const list = document.querySelector('[role="listbox"]')!;
    const e = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    list.dispatchEvent(e);
    expect(e.defaultPrevented).toBe(true);
  });
});

test("PasswordInput: the toggle changes its name, without aria-pressed", () => {
  const out = html(<PasswordInput />);
  expect(out).toContain(`aria-label="${STRINGS.en.showPassword}"`);
  expect(out).not.toContain("aria-pressed");
});

test("ChoiceCardGroup: the label names the choice, the description describes it", async () => {
  const el = await mount(<ChoiceCardGroup type="radio" name="plan" options={[{ value: "a", label: "Project", description: "Fixed scope" }]} />);
  const input = el.querySelector("input")!;
  expect(document.getElementById(input.getAttribute("aria-labelledby")!)?.textContent).toBe("Project");
  expect(document.getElementById(input.getAttribute("aria-describedby")!)?.textContent).toBe("Fixed scope");
});

test("isSaudiIban accepts letters in the 18-character account part (SWIFT format SA2!n2!n18!c)", () => {
  expect(isSaudiIban("SA13 8000 0AB0 6080 1016 7519")).toBe(true);
  expect(isSaudiIban("SA0380000000608010167519")).toBe(true);
  expect(isSaudiIban("SA13AB000AB0608010167519")).toBe(false);
});

test("NumberInput: read-only means the step buttons are disabled", async () => {
  const el = await mount(<NumberInput value={3} onValueChange={noop} readOnly />);
  const buttons = [...el.querySelectorAll("button")];
  expect(buttons).toHaveLength(2);
  expect(buttons.every((b) => b.disabled)).toBe(true);
});

describe("FileDrop", () => {
  const pick = (input: HTMLInputElement, ...files: File[]) =>
    act(async () => {
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      input.files = dt.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

  test("removing a file moves focus to the file input", async () => {
    const el = await mount(<FileDrop name="cv" multiple />);
    const input = el.querySelector<HTMLInputElement>('input[type="file"]')!;
    await pick(input, new File(["x"], "a.pdf"), new File(["x"], "b.pdf"));
    await click(el.querySelector("li button")!);
    expect(el.querySelectorAll("li")).toHaveLength(1);
    expect(document.activeElement).toBe(input);
  });

  test("a form reset empties the list", async () => {
    const got: number[] = [];
    const el = await mount(
      <form>
        <FileDrop name="cv" onFilesChange={(f) => got.push(f.length)} />
      </form>,
    );
    await pick(el.querySelector<HTMLInputElement>('input[type="file"]')!, new File(["x"], "a.pdf"));
    expect(el.querySelectorAll("li")).toHaveLength(1);
    await act(async () => el.querySelector("form")!.reset());
    expect(el.querySelectorAll("li")).toHaveLength(0);
    expect(got.at(-1)).toBe(0);
  });
});

test("DatePicker inside a Field: the label names the trigger, the chosen date describes it", async () => {
  const el = await mount(
    <Field label="Start date" id="start" hint="Any weekday">
      <DatePicker value="2026-02-18" onValueChange={noop} />
    </Field>,
  );
  const ids = el.querySelector("#start")!.getAttribute("aria-describedby")!.split(" ");
  expect(document.getElementById(ids[0]!)?.textContent).toBe("18 February 2026");
  expect(ids).toContain("start-hint");
});

test("PercentProvider: overriding one error string keeps the other error strings", async () => {
  let errors: typeof STRINGS.en.errors | undefined;
  const Grab = () => ((errors = useStrings().errors), null);
  await mount(
    <PercentProvider lang="en" strings={{ errors: { required: "Required" } }}>
      <Grab />
    </PercentProvider>,
  );
  expect(errors!.required).toBe("Required");
  expect(errors!.invalid).toBe(STRINGS.en.errors.invalid);
  expect(errors!.tooLong(3)).toBe(STRINGS.en.errors.tooLong(3));
});

describe("SiteFooter", () => {
  test("a long email address can wrap", () => {
    expect(html(<SiteFooter homeHref="/" email="contact@a-very-long-company-name.example" links={[]} />)).toMatch(/href="mailto:[^"]+"[^>]*wrap-break-word/);
  });
  test("links and legal links may share an href (no duplicate keys)", async () => {
    const errors: unknown[] = [];
    const real = console.error;
    console.error = (...a: unknown[]) => void errors.push(a);
    try {
      await mount(<SiteFooter homeHref="/" links={[{ href: "/privacy", label: "Privacy" }]} legal={[{ href: "/privacy", label: "Privacy policy" }]} />);
    } finally {
      console.error = real;
    }
    expect(errors.filter((e) => String(e).includes("same key"))).toEqual([]);
  });
});

test("Link asChild + external: the child gets the classes, target and rel, and holds the icon", async () => {
  const errors: unknown[] = [];
  const real = console.error;
  console.error = (...a: unknown[]) => void errors.push(a);
  let el: HTMLElement;
  try {
    el = await mount(
      <Link asChild external className="x">
        <a href="https://example.com">Example</a>
      </Link>,
    );
  } finally {
    console.error = real;
  }
  const a = el!.querySelector("a")!;
  expect(a.className).toContain("x");
  expect(a.getAttribute("target")).toBe("_blank");
  expect(a.getAttribute("rel")).toBe("noopener noreferrer");
  expect(a.querySelector("svg")).not.toBeNull();
  expect(a.textContent).toBe(`Example${STRINGS.en.newTab}`);
  expect(errors).toEqual([]);
  // Without asChild the output is unchanged.
  expect(html(<Link href="/a">A</Link>)).toBe('<a class="underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-fg" href="/a">A</a>');
});
