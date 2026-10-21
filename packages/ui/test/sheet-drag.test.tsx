// Drag to close sheets (docs/motion-2.md part 7): touch and pen only, through the normal Radix close.
import { describe, expect, mock, test } from "bun:test";
import { act, useState } from "react";
import { Button, PercentProvider, Popover, Sheet, Slider } from "../src";
import { click, mount, press, useDom } from "./dom";

useDom();

const wait = (ms: number) => act(() => new Promise<void>((r) => setTimeout(r, ms)));
const sheet = () => document.querySelector<HTMLElement>('[role="dialog"]');

const fire = (el: Element, type: string, x: number, y: number, pointerType = "touch", pointerId = 1) =>
  act(async () => {
    el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId, isPrimary: true, button: 0, pointerType, clientX: x, clientY: y } as PointerEventInit));
  });

/** Press at (100, 100), move in four steps by (dx, dy), then release (after `hold` ms without moving).
    Returns the sheet's translate just before the release, so "no drag" checks also fail when the drag is gone. */
async function drag(el: Element, dx: number, dy: number, { pointerType = "touch", hold = 0, end = "pointerup", id = 1 } = {}) {
  await fire(el, "pointerdown", 100, 100, pointerType, id);
  for (const k of [0.25, 0.5, 0.75, 1]) await fire(el, "pointermove", 100 + dx * k, 100 + dy * k, pointerType, id);
  if (hold) await wait(hold);
  const mid = sheet()?.style.translate;
  await fire(el, end, 100 + dx, 100 + dy, pointerType, id);
  return mid;
}

/** A touchmove that bubbles to the sheet; true when the sheet stopped the browser from scrolling. */
function touchmovePrevented(s: HTMLElement) {
  // Radix's scroll lock also cancels touchmove (on document); keep it out of this check.
  s.parentElement!.addEventListener("touchmove", (e) => e.stopPropagation());
  const e = new Event("touchmove", { bubbles: true, cancelable: true });
  s.dispatchEvent(e);
  return e.defaultPrevented;
}

/** happy-dom has no layout: give the sheet a size. */
function size(el: HTMLElement, width: number, height: number) {
  Object.defineProperty(el, "offsetWidth", { value: width, configurable: true });
  Object.defineProperty(el, "offsetHeight", { value: height, configurable: true });
}

async function openSheet(node: React.ReactElement) {
  const el = await mount(node);
  const trigger = el.querySelector("button")!;
  await click(trigger);
  size(sheet()!, 400, 500);
  return trigger;
}

describe("Sheet: drag to close", () => {
  test("a touch drag toward the closing side follows the finger; past 30 % it closes through Radix (onOpenChange, focus back)", async () => {
    const onOpenChange = mock();
    const trigger = await openSheet(
      <Sheet trigger={<Button>Open</Button>} title="Filters" onOpenChange={onOpenChange}>
        x
      </Sheet>,
    );
    const s = sheet()!;
    await fire(s, "pointerdown", 100, 100);
    await fire(s, "pointermove", 110, 102);
    await fire(s, "pointermove", 150, 104);
    expect(s.style.translate).toBe("50px 0");
    expect(s.hasAttribute("data-dragging")).toBe(true);
    await fire(s, "pointermove", 260, 104);
    await wait(150);
    await fire(s, "pointerup", 260, 104);
    expect(sheet()).toBeNull();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await wait(10);
    expect(document.activeElement).toBe(trigger);
  });

  test("a short, slow drag springs back and the sheet stays open", async () => {
    await openSheet(<Sheet trigger={<Button>Open</Button>} title="Filters">x</Sheet>);
    const s = sheet()!;
    expect(await drag(s, 80, 0, { hold: 150 })).toBe("80px 0");
    expect(sheet()).not.toBeNull();
    expect(s.style.translate).toBe("");
    expect(s.hasAttribute("data-dragging")).toBe(false);
  });

  test("a fast flick closes the sheet even when it is short", async () => {
    await openSheet(<Sheet trigger={<Button>Open</Button>} title="Filters">x</Sheet>);
    await drag(sheet()!, 60, 0);
    expect(sheet()).toBeNull();
  });

  test("pointercancel (the browser took the gesture) springs back", async () => {
    await openSheet(<Sheet trigger={<Button>Open</Button>} title="Filters">x</Sheet>);
    const s = sheet()!;
    expect(await drag(s, 300, 0, { end: "pointercancel" })).toBe("300px 0");
    expect(sheet()).not.toBeNull();
    expect(s.style.translate).toBe("");
  });

  test("a pen drags like a finger; a mouse never drags", async () => {
    await openSheet(<Sheet trigger={<Button>Open</Button>} title="Filters">x</Sheet>);
    const s = sheet()!;
    await drag(s, 300, 0, { pointerType: "mouse" });
    expect(s.style.translate).toBe("");
    expect(sheet()).not.toBeNull();
    await drag(s, 300, 0, { pointerType: "pen", hold: 150 });
    expect(sheet()).toBeNull();
  });

  test("side sheet: a mostly vertical move is left to scrolling", async () => {
    await openSheet(<Sheet trigger={<Button>Open</Button>} title="Filters">x</Sheet>);
    const s = sheet()!;
    expect(await drag(s, 20, 300, { hold: 150 })).toBe("");
    expect(sheet()).not.toBeNull();
    expect(await drag(s, 80, 20, { hold: 150 })).toBe("80px 0");
  });

  test("RTL: an end sheet (left in Arabic) closes toward the left; a move to the right does not move it", async () => {
    await openSheet(
      <PercentProvider lang="ar">
        <Sheet trigger={<Button>فتح</Button>} title="تصفية">
          x
        </Sheet>
      </PercentProvider>,
    );
    const s = sheet()!;
    await drag(s, 100, 0, { hold: 150 });
    expect(sheet()).not.toBeNull();
    await fire(s, "pointerdown", 100, 100);
    await fire(s, "pointermove", 90, 100);
    await fire(s, "pointermove", 50, 100);
    expect(s.style.translate).toBe("-50px 0");
    await fire(s, "pointermove", -100, 100);
    await wait(150);
    await fire(s, "pointerup", -100, 100);
    expect(sheet()).toBeNull();
  });

  test("a start sheet closes toward the start side", async () => {
    await openSheet(<Sheet trigger={<Button>Open</Button>} title="Menu" side="start">x</Sheet>);
    const s = sheet()!;
    await drag(s, 200, 0, { hold: 150 });
    expect(sheet()).not.toBeNull();
    await drag(s, -200, 0, { hold: 150 });
    expect(sheet()).toBeNull();
  });

  test("bottom sheet: a visible handle; drag on the header closes even when the content is scrolled", async () => {
    await openSheet(<Sheet trigger={<Button>Open</Button>} title="Share" side="bottom"><p>Body</p></Sheet>);
    const s = sheet()!;
    const handle = s.querySelector("[data-sheet-handle]")!;
    expect(handle.getAttribute("aria-hidden")).toBe("true");
    Object.defineProperty(s, "scrollTop", { value: 80, configurable: true });
    const title = s.querySelector("h2")!;
    await fire(title, "pointerdown", 100, 100);
    await fire(title, "pointermove", 100, 110);
    await fire(title, "pointermove", 100, 140);
    expect(s.style.translate).toBe("0 40px");
    await fire(title, "pointermove", 100, 300);
    await wait(150);
    await fire(title, "pointerup", 100, 300);
    expect(sheet()).toBeNull();
  });

  test("bottom sheet: drag on the content only when it is scrolled to the top; then the browser does not scroll", async () => {
    await openSheet(<Sheet trigger={<Button>Open</Button>} title="Share" side="bottom"><p>Body</p></Sheet>);
    const s = sheet()!;
    const body = s.querySelector("p")!;
    Object.defineProperty(s, "scrollTop", { value: 80, configurable: true });
    await drag(body, 0, 300, { hold: 150 });
    expect(s.style.translate).toBe("");
    expect(sheet()).not.toBeNull();

    Object.defineProperty(s, "scrollTop", { value: 0, configurable: true });
    // Radix's scroll lock also cancels touchmove (on document); keep it out of this check.
    s.parentElement!.addEventListener("touchmove", (e) => e.stopPropagation());
    await fire(body, "pointerdown", 100, 100);
    const early = new Event("touchmove", { bubbles: true, cancelable: true });
    body.dispatchEvent(early);
    expect(early.defaultPrevented).toBe(false);
    await fire(body, "pointermove", 100, 110);
    await fire(body, "pointermove", 100, 160);
    const late = new Event("touchmove", { bubbles: true, cancelable: true });
    body.dispatchEvent(late);
    expect(late.defaultPrevented).toBe(true);
    expect(s.style.translate).toBe("0 60px");
    await fire(body, "pointermove", 100, 300);
    await wait(150);
    await fire(body, "pointerup", 100, 300);
    expect(sheet()).toBeNull();
  });
  test("a Slider in a side sheet: a thumb drag moves the slider, not the sheet", async () => {
    await openSheet(
      <Sheet trigger={<Button>Open</Button>} title="Filters">
        <Slider aria-label="Budget" defaultValue={[50]} />
      </Sheet>,
    );
    const s = sheet()!;
    expect(await drag(s.querySelector('[role="slider"]')!, 300, 0, { hold: 150 })).toBe("");
    expect(sheet()).not.toBeNull();
    expect(await drag(s.querySelector("h2")!, 80, 0, { hold: 150 })).toBe("80px 0");
  });

  test("Popover content opened from a sheet: a drag in it does not move the sheet (React bubbles portal events)", async () => {
    await openSheet(
      <Sheet trigger={<Button>Open</Button>} title="Filters">
        <Popover trigger={<Button>More</Button>}>
          <p>Options</p>
        </Popover>
      </Sheet>,
    );
    const s = sheet()!;
    await click([...s.querySelectorAll("button")].find((b) => b.textContent === "More")!);
    const options = [...document.querySelectorAll("p")].find((p) => p.textContent === "Options")!;
    expect(s.contains(options)).toBe(false);
    expect(await drag(options, 300, 0, { hold: 150 })).toBe("");
    expect(sheet()).not.toBeNull();
    expect(await drag(s.querySelector("h2")!, 80, 0, { hold: 150 })).toBe("80px 0");
  });

  test("data-sheet-no-drag: a drag there does not move the sheet", async () => {
    await openSheet(
      <Sheet trigger={<Button>Open</Button>} title="Filters">
        <div data-sheet-no-drag>
          <p>Map</p>
        </div>
      </Sheet>,
    );
    const s = sheet()!;
    expect(await drag(s.querySelector("p")!, 300, 0, { hold: 150 })).toBe("");
    expect(sheet()).not.toBeNull();
    expect(await drag(s.querySelector("h2")!, 80, 0, { hold: 150 })).toBe("80px 0");
  });

  test("side sheet: a horizontal scroller inside keeps its own horizontal pan", async () => {
    await openSheet(
      <Sheet trigger={<Button>Open</Button>} title="Filters">
        <div className="wide" style={{ overflowX: "auto" }}>
          <p>Table</p>
        </div>
      </Sheet>,
    );
    const s = sheet()!;
    const box = s.querySelector(".wide")!;
    const cell = s.querySelector("p")!;
    expect(await drag(cell, 80, 0, { hold: 150 })).toBe("80px 0");
    Object.defineProperty(box, "scrollWidth", { value: 800, configurable: true });
    Object.defineProperty(box, "clientWidth", { value: 300, configurable: true });
    expect(await drag(cell, 300, 0, { hold: 150 })).toBe("");
    expect(sheet()).not.toBeNull();
  });

  test("closing during a drag leaves no drag behind: after reopening, touch scrolls and a new drag works", async () => {
    const trigger = await openSheet(<Sheet trigger={<Button>Open</Button>} title="Filters">x</Sheet>);
    let s = sheet()!;
    await fire(s, "pointerdown", 100, 100);
    await fire(s, "pointermove", 150, 100);
    expect(s.style.translate).toBe("50px 0");
    await press(s, { key: "Escape" });
    expect(sheet()).toBeNull();

    await click(trigger);
    s = sheet()!;
    size(s, 400, 500);
    expect(touchmovePrevented(s)).toBe(false);
    // A press whose release never arrives (its target left the page) does not block the next one.
    await fire(s, "pointerdown", 100, 100, "touch", 2);
    expect(await drag(s, 300, 0, { hold: 150, id: 3 })).toBe("300px 0");
    expect(sheet()).toBeNull();
  });

  test("a re-render during a drag does not end it", async () => {
    let rerender = () => {};
    function Live() {
      const [n, setN] = useState(0);
      rerender = () => setN(n + 1);
      return (
        <Sheet defaultOpen title={`Filters ${n}`}>
          x
        </Sheet>
      );
    }
    await mount(<Live />);
    const s = sheet()!;
    size(s, 400, 500);
    await fire(s, "pointerdown", 100, 100);
    await fire(s, "pointermove", 150, 100);
    await act(async () => rerender());
    expect(s.querySelector("h2")!.textContent).toBe("Filters 1");
    await fire(s, "pointermove", 200, 100);
    expect(s.style.translate).toBe("100px 0");
  });

  test("losing pointer capture mid-drag springs back; a child losing its implicit capture does not", async () => {
    await openSheet(<Sheet trigger={<Button>Open</Button>} title="Filters">x</Sheet>);
    const s = sheet()!;
    await fire(s, "pointerdown", 100, 100);
    await fire(s, "pointermove", 150, 100);
    expect(s.hasPointerCapture(1)).toBe(true);
    await fire(s.querySelector("h2")!, "lostpointercapture", 150, 100);
    expect(s.style.translate).toBe("50px 0");
    await fire(s, "lostpointercapture", 150, 100);
    expect(s.style.translate).toBe("");
    expect(s.hasAttribute("data-dragging")).toBe(false);
    expect(touchmovePrevented(s)).toBe(false);
  });

  test("a controlled sheet that stays open after the close (an unsaved-changes confirm) springs back", async () => {
    const onOpenChange = mock();
    await mount(
      <Sheet open title="Edit" onOpenChange={onOpenChange}>
        x
      </Sheet>,
    );
    const s = sheet()!;
    size(s, 400, 500);
    expect(await drag(s, 300, 0, { hold: 150 })).toBe("300px 0");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await wait(50);
    expect(sheet()).toBe(s);
    expect(s.style.translate).toBe("");
  });
});
