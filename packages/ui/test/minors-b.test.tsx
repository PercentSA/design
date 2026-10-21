import { describe, expect, test } from "bun:test";
import { act, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Checkbox, Field, FileDrop, PercentProvider, PhoneInput, RadioGroup, Slider, STRINGS, Switch, type PhoneCountryCode } from "../src";
import { mount, useDom } from "./dom";

useDom();

const noop = () => {};
const textOf = (ids: string | null) =>
  (ids ?? "")
    .split(" ")
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent ?? "")
    .join(" ");
// The accessible name of these controls: aria-labelledby first, else the <label> around the control.
const nameOf = (el: Element) => (el.hasAttribute("aria-labelledby") ? textOf(el.getAttribute("aria-labelledby")) : (el.closest("label")?.textContent ?? ""));
const descOf = (el: Element) => textOf(el.getAttribute("aria-describedby"));

describe("B1 choices: the label names the control, the description describes it", () => {
  test("Checkbox, Switch and RadioGroup items", async () => {
    const el = await mount(
      <>
        <Checkbox label="Newsletter" description="Every Sunday" aria-describedby="extra" />
        <p id="extra">Unsubscribe at any time</p>
        <Switch label="Weekly report" description="Every Monday" />
        <RadioGroup
          options={[
            { value: "a", label: "Plan A", description: "For one person" },
            { value: "b", label: "Plan B" },
          ]}
        />
      </>,
    );
    const cb = el.querySelector('[role="checkbox"]')!;
    const sw = el.querySelector('[role="switch"]')!;
    const [ra, rb] = [...el.querySelectorAll('[role="radio"]')];
    expect([nameOf(cb), descOf(cb)]).toEqual(["Newsletter", "Every Sunday Unsubscribe at any time"]);
    expect([nameOf(sw), descOf(sw)]).toEqual(["Weekly report", "Every Monday"]);
    expect([nameOf(ra!), descOf(ra!)]).toEqual(["Plan A", "For one person"]);
    expect([nameOf(rb!), rb!.hasAttribute("aria-describedby")]).toEqual(["Plan B", false]);
  });
});

const pick = (input: HTMLInputElement, ...files: File[]) =>
  act(async () => {
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    input.files = dt.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });

describe("B2 FileDrop (one file): a refused file keeps the file chosen before", () => {
  test("wrong type and too large: the earlier file stays, the error shows, the box has the error border", async () => {
    const got: string[][] = [];
    const el = await mount(<FileDrop name="cv" accept=".pdf" maxSizeMb={1} onFilesChange={(f) => got.push(f.map((x) => x.name))} />);
    const input = el.querySelector<HTMLInputElement>('input[type="file"]')!;
    const box = el.querySelector("label")!;
    await pick(input, new File(["x"], "cv.pdf", { type: "application/pdf" }));
    expect(box.className).not.toContain("border-danger");

    await pick(input, new File(["x"], "photo.png", { type: "image/png" }));
    expect(el.querySelector('[role="alert"]')?.textContent).toBe(STRINGS.en.errors.fileType);
    expect(el.querySelector("li")?.textContent).toContain("cv.pdf");
    expect([...input.files!].map((f) => f.name)).toEqual(["cv.pdf"]);
    expect(got.at(-1)).toEqual(["cv.pdf"]);
    expect(box.className).toContain("border-danger");
    expect(input.getAttribute("aria-invalid")).toBe("true");

    await pick(input, new File([new Uint8Array(2_000_000)], "big.pdf", { type: "application/pdf" }));
    expect(el.querySelector('[role="alert"]')?.textContent).toBe(STRINGS.en.errors.fileTooLarge(1));
    expect([...input.files!].map((f) => f.name)).toEqual(["cv.pdf"]);

    await pick(input, new File(["x"], "cv2.pdf", { type: "application/pdf" }));
    expect(el.querySelector('[role="alert"]')).toBeNull();
    expect(el.querySelector("li")?.textContent).toContain("cv2.pdf");
    expect(box.className).not.toContain("border-danger");
  });
  test("inside a Field with an error the box has the error border", () => {
    const out = renderToStaticMarkup(
      <Field label="CV" error="Add your CV">
        <FileDrop name="cv" />
      </Field>,
    );
    expect(out).toMatch(/<label[^>]*border-danger/);
  });
});

describe("B3 PhoneInput posts the country with the form, also without JavaScript", () => {
  const posted = (markup: string) => {
    document.body.innerHTML = markup;
    return new FormData(document.querySelector("form")!);
  };
  test("server HTML: the current country posts under `${name}-country`, or the name the app sets", () => {
    const html = (node: React.ReactNode) => renderToStaticMarkup(<form>{node}</form>);
    expect(posted(html(<PhoneInput name="phone" value="" onValueChange={noop} country="AE" onCountryChange={noop} />)).get("phone-country")).toBe("AE");
    expect(posted(html(<PhoneInput name="phone" countryName="cc" value="" onValueChange={noop} country="SA" onCountryChange={noop} />)).get("cc")).toBe("SA");
    expect([...posted(html(<PhoneInput value="" onValueChange={noop} country="SA" onCountryChange={noop} />)).keys()]).toEqual([]);
  });
  test("with JavaScript the posted country follows the chosen one", async () => {
    let set: (c: PhoneCountryCode) => void = noop;
    function Form() {
      const [c, setC] = useState<PhoneCountryCode>("SA");
      set = setC;
      return (
        <form>
          <PhoneInput name="phone" value="" onValueChange={noop} country={c} onCountryChange={setC} />
        </form>
      );
    }
    const el = await mount(<Form />);
    await act(async () => set("KW"));
    expect(new FormData(el.querySelector("form")!).get("phone-country")).toBe("KW");
  });
});

describe("B4 Slider with two thumbs: each thumb has its own name", () => {
  const thumbs = (el: Element) => [...el.querySelectorAll('[role="slider"]')];
  test("aria-label names the group; the thumbs are Minimum and Maximum", async () => {
    const el = await mount(<Slider aria-label="Price" defaultValue={[20, 80]} />);
    expect(thumbs(el).map((t) => t.getAttribute("aria-label"))).toEqual(["Minimum", "Maximum"]);
    expect(el.querySelector('[role="group"]')?.getAttribute("aria-label")).toBe("Price");
  });
  test("Arabic names", async () => {
    const el = await mount(
      <PercentProvider lang="ar">
        <Slider defaultValue={[20, 80]} />
      </PercentProvider>,
    );
    expect(thumbs(el).map((t) => t.getAttribute("aria-label"))).toEqual([STRINGS.ar.minimum, STRINGS.ar.maximum]);
  });
  test("inside a Field the group takes the field label; the app can set the thumb names", async () => {
    const el = await mount(
      <Field label="Budget">
        <Slider defaultValue={[20, 80]} thumbLabels={["From", "To"]} />
      </Field>,
    );
    expect(textOf(el.querySelector('[role="group"]')!.getAttribute("aria-labelledby"))).toBe("Budget");
    expect(thumbs(el).map((t) => [t.getAttribute("aria-label"), t.hasAttribute("aria-labelledby")])).toEqual([
      ["From", false],
      ["To", false],
    ]);
  });
});

describe("PhoneInput error state", () => {
  test('a phone issue sets aria-invalid, also when the app passes aria-invalid="false"', async () => {
    const el = await mount(<PhoneInput aria-invalid="false" value="5012" onValueChange={noop} country="SA" onCountryChange={noop} />);
    const input = el.querySelector<HTMLInputElement>('input[type="tel"]')!;
    await act(async () => input.dispatchEvent(new FocusEvent("focusout", { bubbles: true })));
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });
});
