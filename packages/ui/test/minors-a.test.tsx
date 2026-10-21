import { describe, expect, test } from "bun:test";
import { act, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Field, IbanInput, Input, MoneyInput, NationalIdInput, NumberInput, SearchInput, stepNumber } from "../src";
import { mount, useDom } from "./dom";

useDom();

// Type like a person: the browser changes the text and the caret, then sends "input". The prototype setter skips React's value tracker.
const setText = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
async function edit(input: HTMLInputElement, text: string, caret: number) {
  await act(async () => {
    input.focus();
    setText.call(input, text);
    input.setSelectionRange(caret, caret);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function Iban() {
  const [v, setV] = useState("SA0380000000");
  return <IbanInput value={v} onValueChange={setV} />;
}
function Money() {
  const [v, setV] = useState("1250");
  return <MoneyInput value={v} onValueChange={setV} />;
}
function Id() {
  const [v, setV] = useState("1010");
  return <NationalIdInput value={v} onValueChange={setV} />;
}
function Num() {
  const [v, setV] = useState<number | null>(1250);
  return <NumberInput value={v} onValueChange={setV} />;
}

describe("A1: inputs that reformat as you type keep the caret", () => {
  test("IbanInput: typing in the middle keeps the caret after the typed character", async () => {
    const input = (await mount(<Iban />)).querySelector("input")!;
    expect(input.value).toBe("SA03 8000 0000");
    // Type "1" after "SA03 8": the groups shift, the caret stays after the "1".
    await edit(input, "SA03 81000 0000", 7);
    expect(input.value).toBe("SA03 8100 0000 0");
    expect(input.selectionStart).toBe(7);
  });
  test("IbanInput: deleting in the middle keeps the caret after the same character", async () => {
    const input = (await mount(<Iban />)).querySelector("input")!;
    // Delete the "8": the caret stays after "SA03".
    await edit(input, "SA03 000 0000", 5);
    expect(input.value).toBe("SA03 0000 000");
    expect(input.selectionStart).toBe(4);
  });
  test("MoneyInput, NationalIdInput and NumberInput: a removed character does not move the caret to the end", async () => {
    for (const [node, typed, caret, value, after] of [
      [<Money />, "12x50", 3, "1250", 2],
      [<Id />, "1٠a10", 3, "1010", 2],
      [<Num />, "12,50", 3, "1250", 2],
    ] as const) {
      const input = (await mount(node)).querySelector("input")!;
      await edit(input, typed, caret);
      expect(input.value).toBe(value);
      expect(input.selectionStart).toBe(after);
    }
  });
});

describe("A2: step buttons go to the step grid", () => {
  test("a value off the grid goes to the next or previous grid value", () => {
    expect(stepNumber(5, 2, 1, { min: 0 })).toBe(6);
    expect(stepNumber(5, 2, -1, { min: 0 })).toBe(4);
    // Without min the grid starts at 0; with min it starts at min.
    expect(stepNumber(5, 2, 1)).toBe(6);
    expect(stepNumber(4, 2, 1, { min: 1 })).toBe(5);
    expect(stepNumber(4, 2, -1, { min: 1 })).toBe(3);
  });
  test("the existing rules stay: negatives, decimals without float noise, limits", () => {
    expect(stepNumber(-1, 2, -1, { min: -6 })).toBe(-2);
    expect(stepNumber(0.3, 0.1, 1)).toBe(0.4);
    expect(stepNumber(0.3, 0.1, -1)).toBe(0.2);
    expect(stepNumber(0.75, 0.5, 1, { min: 0.25 })).toBe(1.25);
    expect(stepNumber(9, 2, 1, { min: 0, max: 9 })).toBe(9);
  });
});

describe("A3: SearchInput takes its name from the page when it has one", () => {
  test("inside a Field the label names the input, not the default aria-label", () => {
    const out = renderToStaticMarkup(
      <Field label="Find a project" id="q">
        <SearchInput />
      </Field>,
    );
    expect(out).toMatch(/<input[^>]*id="q"/);
    expect(out).not.toContain('aria-label="Search"');
  });
  test("aria-labelledby names the input, not the default aria-label", () => {
    expect(renderToStaticMarkup(<SearchInput aria-labelledby="title" />)).not.toContain('aria-label="Search"');
  });
  test("alone, it keeps the default name", () => {
    expect(renderToStaticMarkup(<SearchInput />)).toContain('aria-label="Search"');
  });
});

describe("A4: Input with adornments shows the error border only when invalid", () => {
  const box = async (invalid: boolean | "true" | "false") =>
    (await mount(<Input aria-invalid={invalid} start={<span>x</span>} />)).firstElementChild!.classList;
  test('aria-invalid="false" or false: no error border', async () => {
    expect((await box("false")).contains("border-danger")).toBe(false);
    expect((await box(false)).contains("border-danger")).toBe(false);
  });
  test('aria-invalid="true" or true: error border', async () => {
    expect((await box("true")).contains("border-danger")).toBe(true);
    expect((await box(true)).contains("border-danger")).toBe(true);
  });
});
