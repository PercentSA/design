import { describe, expect, test } from "bun:test";
import { useState } from "react";
import { ActionDialog, FieldsSheet } from "../src";
import { click, mount, stubMatchMedia, useDom } from "./dom";

useDom();

const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')!;

const actionDialog = (reason: { label: string; maxLength?: number }) =>
  mount(<ActionDialog open onOpenChange={() => {}} onAction={() => {}} title="Do it?" subject={{ title: "Main website" }} effects={["It stops."]} action="Do it" reason={reason} />);

describe("ActionDialog reason.maxLength", () => {
  test("the reason field holds maxLength", async () => {
    await actionDialog({ label: "Why", maxLength: 200 });
    expect(dialog().querySelector("textarea")!.getAttribute("maxlength")).toBe("200");
  });
  test("without maxLength the reason field has no maxlength attribute", async () => {
    await actionDialog({ label: "Why" });
    expect(dialog().querySelector("textarea")!.hasAttribute("maxlength")).toBe(false);
  });
});

function Sheet({ inputMode, suggestions }: { inputMode?: "numeric"; suggestions?: { value: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <FieldsSheet title="Edit" open={open} onOpenChange={setOpen} onSubmit={() => {}} fields={[{ key: "port", label: "Port", value: "8080", inputMode, suggestions }]} />
    </>
  );
}

describe("FieldsSheet field inputMode", () => {
  test("a field with inputMode numeric", async () => {
    stubMatchMedia(true);
    await mount(<Sheet inputMode="numeric" />);
    await click(document.querySelector("button")!);
    expect(dialog().querySelector("input")!.getAttribute("inputmode")).toBe("numeric");
  });
  test("a field without inputMode has no inputmode attribute", async () => {
    stubMatchMedia(true);
    await mount(<Sheet />);
    await click(document.querySelector("button")!);
    expect(dialog().querySelector("input")!.hasAttribute("inputmode")).toBe(false);
  });
  test("a field with suggestions and inputMode", async () => {
    stubMatchMedia(true);
    await mount(<Sheet inputMode="numeric" suggestions={[{ value: "8080" }, { value: "3000" }]} />);
    await click(document.querySelector("button")!);
    expect(dialog().querySelector("input")!.getAttribute("inputmode")).toBe("numeric");
  });
});
