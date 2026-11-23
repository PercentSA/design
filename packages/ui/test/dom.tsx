// Mount components in the test DOM (registered in /test-setup.ts). Call useDom() at the top of a test file.
import { afterEach } from "bun:test";
import { act, type ReactNode } from "react";
import type { Root } from "react-dom/client";

let roots: Root[] = [];

export function useDom() {
  afterEach(async () => {
    restoreMatchMedia();
    await act(async () => roots.forEach((r) => r.unmount()));
    roots = [];
    document.body.innerHTML = "";
  });
}

let ownMatchMedia: PropertyDescriptor | undefined | null = null; // null: not stubbed

/** Replaces `matchMedia` with a stub that always answers `matches`. `useDom()` restores it after each test. */
export function stubMatchMedia(matches: boolean) {
  if (ownMatchMedia === null) ownMatchMedia = Object.getOwnPropertyDescriptor(globalThis, "matchMedia");
  Object.defineProperty(globalThis, "matchMedia", {
    configurable: true,
    writable: true,
    value: (q: string) => ({ matches, media: q, addEventListener() {}, removeEventListener() {} }),
  });
}

/** Removes `matchMedia` from the window (an environment without it). */
export function removeMatchMedia() {
  stubMatchMedia(false);
  delete (globalThis as { matchMedia?: unknown }).matchMedia;
}

function restoreMatchMedia() {
  if (ownMatchMedia === null) return;
  if (ownMatchMedia) Object.defineProperty(globalThis, "matchMedia", ownMatchMedia);
  else delete (globalThis as { matchMedia?: unknown }).matchMedia;
  ownMatchMedia = null;
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
