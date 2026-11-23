import { describe, expect, test } from "bun:test";
import { SecretRow } from "../src";
import { mount, useDom } from "./dom";

useDom();

const names = (el: HTMLElement) => [...el.querySelectorAll("button")].map((b) => b.getAttribute("aria-label") ?? b.textContent);
const row = (props: { canEdit?: boolean; action?: boolean }) => (
  <SecretRow
    label="Webhook"
    canEdit={props.canEdit ?? true}
    secret={{ set: true }}
    onSave={async () => {}}
    onRemove={async () => {}}
    action={props.action ? <button type="button">Test</button> : undefined}
  />
);

describe("SecretRow action", () => {
  test("the action shows before the menu", async () => {
    const el = await mount(row({ action: true }));
    expect(names(el)).toEqual(["Change", "Test", "More actions"]);
  });
  test("without action the control is as in 0.24.0", async () => {
    const el = await mount(row({}));
    expect(names(el)).toEqual(["Change", "More actions"]);
  });
  test("no action when the row cannot be edited", async () => {
    const el = await mount(row({ canEdit: false, action: true }));
    expect(names(el)).toEqual([]);
  });
});
