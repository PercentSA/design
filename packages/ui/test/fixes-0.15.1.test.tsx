import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Field, Input, PhoneInput } from "../src";

describe("0.15.1", () => {
  // In a grid row next to a taller field, a field keeps its label and control at the top (no stretched rows).
  test("Field rows start at the top of the cell", () => {
    const html = renderToStaticMarkup(
      <Field label="Name">
        <Input />
      </Field>,
    );
    expect(html).toMatch(/^<div class="grid content-start gap-2.5"/);
  });

  test("PhoneInput rows start at the top of the cell", () => {
    const html = renderToStaticMarkup(<PhoneInput value="" onValueChange={() => {}} country="SA" onCountryChange={() => {}} />);
    expect(html).toMatch(/^<div class="grid content-start gap-2.5"/);
  });
});
