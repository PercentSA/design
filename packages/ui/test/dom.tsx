// Mount components in the test DOM (registered in /test-setup.ts). Call useDom() at the top of a test file.
import { afterEach } from "bun:test";
import { act, type ReactNode } from "react";
import type { Root } from "react-dom/client";

let roots: Root[] = [];

export function useDom() {
  afterEach(async () => {
    await act(async () => roots.forEach((r) => r.unmount()));
    roots = [];
    document.body.innerHTML = "";
  });
}

export async function mount(node: ReactNode) {
  const { createRoot } = await import("react-dom/client");
  const el = document.createElement("div");
  document.body.append(el);
  const root = createRoot(el);
  roots.push(root);
  await act(async () => root.render(node));
  return el;
}

export const press = async (el: Element, init: KeyboardEventInit) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init }));
  });

export const click = async (el: Element) =>
  act(async () => {
    (el as HTMLElement).click();
  });
