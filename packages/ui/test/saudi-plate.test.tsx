// SaudiPlate, PlateInput and the plate rules (0.8.0).
import { describe, expect, test } from "bun:test";
import { act, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Field,
  parsePlate,
  PercentProvider,
  plateDigitsAr,
  plateIssueMessage,
  plateLabel,
  plateLatin,
  PLATE_LETTERS,
  plateSearchText,
  PlateInput,
  SaudiPlate,
  STRINGS,
  type Lang,
} from "../src";
import { mount, useDom } from "./dom";

useDom();

const plate = (letters: string, digits: string) => ({ ok: true, empty: false, letters, digits }) as const;

describe("plate rules", () => {
  test("17 plate letters", () => {
    expect(PLATE_LETTERS).toHaveLength(17);
    expect(PLATE_LETTERS.map((l) => l.en).join("")).toBe("ABJDRSXTEGKLZNHUV");
  });

  test("Arabic or Latin letters and either digits, any order", () => {
    expect(parsePlate("ابح 1234")).toEqual(plate("ابح", "1234"));
    expect(parsePlate("1234 ABJ")).toEqual(plate("ابح", "1234"));
    expect(parsePlate("ا ب ح ١٢٣٤")).toEqual(plate("ابح", "1234"));
    expect(parsePlate("abj-1234")).toEqual(plate("ابح", "1234"));
    expect(parsePlate("۱۲ ك")).toEqual(plate("ك", "12"));
  });

  test("1–3 letters, 1–4 digits, leading zeros kept, 0000 refused", () => {
    expect(parsePlate("هـ 5")).toEqual(plate("ه", "5"));
    expect(parsePlate("0123 د")).toEqual(plate("د", "0123"));
    expect(parsePlate("لم 77")).toEqual(plate("لم", "77"));
    expect(parsePlate("ابحد 12")).toEqual({ ok: false, issue: { type: "letterCount" } });
    expect(parsePlate("1234")).toEqual({ ok: false, issue: { type: "letterCount" } });
    expect(parsePlate("ابح")).toEqual({ ok: false, issue: { type: "digits" } });
    expect(parsePlate("ابح 12345")).toEqual({ ok: false, issue: { type: "digits" } });
    expect(parsePlate("ابح 0000")).toEqual({ ok: false, issue: { type: "digits" } });
    expect(parsePlate("   ")).toEqual({ ok: true, empty: true });
  });

  test("look-alike letters map", () => {
    expect(parsePlate("أ 7")).toEqual(plate("ا", "7"));
    expect(parsePlate("إ 7")).toEqual(plate("ا", "7"));
    expect(parsePlate("آ 7")).toEqual(plate("ا", "7"));
    expect(parsePlate("ي 7")).toEqual(plate("ى", "7"));
    expect(parsePlate("ة 7")).toEqual(plate("ه", "7"));
  });

  test("a letter that is not on plates is refused, with the letter in the message, in both languages", () => {
    const r = parsePlate("ث 12");
    expect(r).toEqual({ ok: false, issue: { type: "letter", char: "ث" } });
    expect(parsePlate("F 12")).toEqual({ ok: false, issue: { type: "letter", char: "F" } });
    const issue = { type: "letter", char: "ث" } as const;
    expect(plateIssueMessage(issue, "ar")).toBe('"ث" لا يُستخدم في اللوحات — المسموح: ا ب ح د ر س ص ط ع ق ك ل م ن هـ و ى');
    expect(plateIssueMessage(issue, "en")).toContain('"ث"');
    expect(plateIssueMessage(issue, "en")).toContain("A B J D R S X T E G K L Z N H U V");
    expect(plateIssueMessage({ type: "letterCount" }, "ar")).toBe("اللوحة من 1 إلى 3 حروف");
    expect(plateIssueMessage({ type: "digits" }, "ar")).toBe("رقم اللوحة من 1 إلى 4 أرقام");
    expect(plateIssueMessage({ type: "letterCount" })).toBe(STRINGS.en.errors.plateLetterCount);
    expect(plateIssueMessage({ type: "digits" })).toBe("A plate has 1 to 4 digits.");
  });

  test("Latin row in the same order, Arabic-Indic digits, label in both languages", () => {
    expect(plateLatin("ابح")).toBe("A B J");
    expect(plateDigitsAr("0123")).toBe("٠١٢٣");
    expect(plateLabel("ابح", "1234", "ar")).toBe("لوحة ا ب ح 1234");
    expect(plateLabel("ابح", "1234", "en")).toBe("Plate A B J 1234");
    expect(plateLabel("ابح", "1234")).toBe("Plate A B J 1234");
    expect(plateSearchText("ابح", "1234")).toBe("ابح ا ب ح ABJ 1234 ١٢٣٤");
    expect(plateSearchText(null, "1234")).toBe("");
  });
});

const html = (lang: Lang, letters: string, digits: string, size?: "sm" | "md" | "lg") =>
  renderToStaticMarkup(
    <PercentProvider lang={lang}>
      <SaudiPlate letters={letters} digits={digits} size={size} />
    </PercentProvider>,
  );

describe("SaudiPlate", () => {
  test("SaudiPlate is LTR on Arabic pages, role img, no hex or palette colour classes", () => {
    const ar = html("ar", "ابح", "1234");
    expect(ar).toContain('role="img"');
    expect(ar).toContain('aria-label="لوحة ا ب ح 1234"');
    expect(ar).toContain('dir="ltr"');
    // Both rows: Arabic-Indic digits and letters on top, Western digits and Latin letters below.
    for (const part of ["١٢٣٤", ">1234<", "ا ب ح", "A B J", "السعودية"]) expect(ar).toContain(part);
    expect(ar).not.toMatch(/#[0-9a-f]{3,6}|neutral-|\bbg-white\b|\bbg-black\b/);
    // No emblem until the owner decides: no drawing in the plate.
    expect(ar).not.toContain("<svg");
    const en = html("en", "ه", "55", "sm");
    expect(en).toContain('aria-label="Plate H 55"');
    expect(en).toContain("٥٥");
    expect(en).toContain(">H<");
  });

  test("SaudiPlate label follows provider string overrides", () => {
    const out = renderToStaticMarkup(
      <PercentProvider lang="en" strings={{ plate: "Number plate" }}>
        <SaudiPlate letters="ابح" digits="1234" />
      </PercentProvider>,
    );
    expect(out).toContain('aria-label="Number plate A B J 1234"');
    expect(plateLabel("ابح", "1234", "ar", { ...STRINGS.ar, plate: "رقم" })).toBe("رقم ا ب ح 1234");
  });
});

describe("PlateInput", () => {
  test("PlateInput: live plate after valid text; error and aria-invalid after a bad letter; hint when empty", async () => {
    let set!: (text: string) => void;
    function Plate() {
      const [value, setValue] = useState("");
      set = setValue;
      return (
        <PercentProvider lang="ar">
          <Field label="لوحة السيارة" id="plate">
            <PlateInput value={value} onValueChange={setValue} />
          </Field>
        </PercentProvider>
      );
    }
    const el = await mount(<Plate />);
    const input = el.querySelector<HTMLInputElement>("#plate")!;
    const described = () => (input.getAttribute("aria-describedby") ?? "").split(" ").map((id) => document.getElementById(id)?.textContent);
    expect(described()).toContain(STRINGS.ar.plateHint);
    expect(input.getAttribute("aria-invalid")).toBeNull();
    expect(el.querySelector('[role="img"]')).toBeNull();

    // Typing goes through onValueChange.
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "abj 1234");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(input.value).toBe("abj 1234");
    expect(el.querySelector('[role="img"]')!.getAttribute("aria-label")).toBe("لوحة ا ب ح 1234");
    expect(input.getAttribute("aria-invalid")).toBeNull();

    await act(async () => set("ثب 12"));
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(described()).toContain(plateIssueMessage({ type: "letter", char: "ث" }, "ar"));
    expect(described()).not.toContain(STRINGS.ar.plateHint);
    expect(el.querySelector('[role="img"]')).toBeNull();
  });
});
