import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Checkbox,
  ChipGroup,
  ChoiceCardGroup,
  Field,
  Fieldset,
  Honeypot,
  Input,
  PercentProvider,
  RadioGroup,
  Select,
  Slider,
  Switch,
  Textarea,
} from "../src";

const html = (node: React.ReactNode) => renderToStaticMarkup(node);
const attr = (out: string, tag: string, name: string) => out.match(new RegExp(`<${tag}[^>]*?\\s${name}="([^"]*)"`))?.[1];

describe("Field wiring", () => {
  test("label, hint and error are linked to the control", () => {
    const out = html(
      <Field label="Email" hint="Your work email" error="Enter a valid email address.">
        <Input type="email" />
      </Field>,
    );
    const id = attr(out, "input", "id")!;
    expect(attr(out, "label", "for")).toBe(id);
    const describedBy = attr(out, "input", "aria-describedby")!.split(" ");
    expect(describedBy).toHaveLength(2);
    for (const ref of describedBy) expect(out).toContain(`id="${ref}"`);
    expect(out).toContain('aria-invalid="true"');
    expect(out).toContain("Enter a valid email address.");
  });
  test("no error: not invalid; required and optional are shown", () => {
    const out = html(<Field label="Name" required><Input /></Field>);
    expect(out).not.toContain('aria-invalid="');
    expect(out).toContain("required");
    expect(html(<PercentProvider lang="ar"><Field label="الشركة" optional><Input /></Field></PercentProvider>)).toContain("اختياري");
  });
  test("Field id names the control, for links and tests", () => {
    const out = html(<Field label="Name" id="name"><Input /></Field>);
    expect(attr(out, "label", "for")).toBe("name");
    expect(attr(out, "input", "id")).toBe("name");
  });
  test("the character counter is read by screen readers", () => {
    const out = html(<Field label="Message" count={120} max={2000}><Textarea maxLength={2000} /></Field>);
    expect(out).toContain("120 of 2000 characters");
    const describedBy = attr(out, "textarea", "aria-describedby")!;
    expect(out).toContain(`id="${describedBy}"`);
  });
  test("Select and Slider take the field label", () => {
    const sel = html(<Field label="City"><Select options={[{ value: "ruh", label: "Riyadh" }]} placeholder="Choose" /></Field>);
    expect(attr(sel, "button", "id")).toBe(attr(sel, "label", "for"));
    const sl = html(<Field label="Budget"><Slider defaultValue={[50]} /></Field>);
    expect(attr(sl, "span", "aria-labelledby")).toBe(attr(sl, "label", "id"));
  });
});

describe("choices", () => {
  test("Checkbox, Switch and RadioGroup have labels and states", () => {
    expect(html(<Checkbox label="I agree" defaultChecked />)).toContain('aria-checked="true"');
    expect(html(<Checkbox label="I agree" />)).toContain(">I agree<");
    expect(html(<Switch label="Dark mode" />)).toContain('role="switch"');
    const radio = html(<RadioGroup aria-label="Plan" defaultValue="b" options={[{ value: "a", label: "A" }, { value: "b", label: "B" }]} />);
    expect(radio).toContain('role="radiogroup"');
    expect(radio.match(/role="radio"/g)).toHaveLength(2);
  });
  test("ChipGroup and ChoiceCardGroup are native inputs (they post without JavaScript)", () => {
    const chips = html(<ChipGroup type="checkbox" name="services" defaultValue={["web"]} options={[{ value: "web", label: "Web" }, { value: "app", label: "App" }]} />);
    const inputs = chips.match(/<input [^>]*>/g)!;
    expect(inputs).toHaveLength(2);
    for (const i of inputs) expect(i).toContain('name="services"');
    expect(inputs[0]).toContain('checked=""');
    expect(inputs[1]).not.toContain("checked");
    const cards = html(<ChoiceCardGroup type="radio" name="plan" options={[{ value: "a", label: "Project", description: "Fixed scope" }]} />);
    expect(cards).toContain('type="radio"');
    expect(cards).toContain("Fixed scope");
  });
  test("Fieldset groups choices with a legend and links its hint and error", () => {
    const out = html(<Fieldset legend="Services" hint="Pick any" error="Pick one"><span /></Fieldset>);
    expect(out).toContain("<legend");
    const ids = attr(out, "fieldset", "aria-describedby")!.split(" ");
    expect(ids).toHaveLength(2);
  });
  test("Honeypot is hidden from people and skipped by the keyboard", () => {
    const out = html(<Honeypot name="website" />);
    expect(out).toContain('aria-hidden="true"');
    expect(out).toContain('tabindex="-1"');
    expect(out).toContain('name="website"');
  });
});
