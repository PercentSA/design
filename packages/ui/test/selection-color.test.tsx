import { describe, expect, test } from "bun:test";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PercentProvider } from "../src/provider";
import { buttonClass } from "../src/components/button-class";
import { ChoiceCardGroup, RadioGroup } from "../src/components/choices";
import { Slider } from "../src/components/inputs";
import { Steps, Tabs } from "../src/components/navigation";
import { Timeline } from "../src/components/timeline";

const en = (node: ReactNode) => renderToStaticMarkup(<PercentProvider lang="en">{node}</PercentProvider>);
// A selected indicator drawn in fg (bg-fg, border-fg, ring-fg), not fg-2/fg-3 or fg/10.
const FG_INDICATOR = /(?<![\w-])(bg|border)-fg(?![\w/-])|(?<![\w-])text-bg(?![\w/-])/;
const options = [
  { value: "a", label: "A" },
  { value: "b", label: "B" },
];

describe("selected states use primary (spec §3)", () => {
  test.each<[string, ReactNode, string[]]>([
    ["Radio", <RadioGroup defaultValue="a" options={options} />, ["data-[state=checked]:border-primary", "bg-primary"]],
    [
      "ChoiceCard",
      <ChoiceCardGroup type="radio" name="plan" defaultValue={["a"]} options={options} />,
      ["peer-checked:border-primary", "[input:checked+&amp;_.p-check]:bg-primary", "[input:checked+&amp;_.p-check]:text-primary-fg"],
    ],
    ["Slider", <Slider defaultValue={[40]} aria-label="Volume" />, ["bg-primary", "border-primary"]],
    ["Tabs", <Tabs defaultValue="a" items={options.map((o) => ({ ...o, content: o.label }))} />, ["data-[state=active]:border-primary"]],
    ["Steps", <Steps current={1} items={[{ label: "One" }, { label: "Two" }, { label: "Three" }]} />, ["border-primary bg-primary text-primary-fg", "bg-primary"]],
    [
      "Timeline",
      <Timeline
        items={[
          { id: "1", time: "1", title: "Done", status: "done" },
          { id: "2", time: "2", title: "Now", status: "current" },
          { id: "3", time: "3", title: "Next", status: "next" },
        ]}
      />,
      ["bg-primary", "bg-primary ring-4"],
    ],
  ])("%s", (_, node, classes) => {
    const out = en(node);
    expect(out).not.toMatch(FG_INDICATOR);
    for (const c of classes) expect(out).toContain(c);
  });

  test("Steps: the current step's border is primary", () => {
    expect(en(<Steps current={0} items={[{ label: "One" }, { label: "Two" }]} />)).toContain("border-primary text-fg");
  });

  test("danger button: text-danger-fg on danger, not primary-fg", () => {
    expect(buttonClass("danger")).toContain("text-danger-fg");
    expect(buttonClass("danger")).not.toContain("text-primary-fg");
  });
});
