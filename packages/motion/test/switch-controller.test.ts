import { describe, expect, test } from "bun:test";
import { createSwitchController, type ScrambleTarget } from "../src";

function setup(reduced = false) {
  let now = 0;
  const timers: { at: number; fn: () => void }[] = [];
  const navigations: string[] = [];
  const writes = new Map<ScrambleTarget, (string | null)[]>();
  const mk = (text: string, top: number, onScreen = true): ScrambleTarget => {
    const t: ScrambleTarget = { text: () => text, top: () => top, onScreen: () => onScreen, write: (s) => writes.get(t)!.push(s) };
    writes.set(t, []);
    return t;
  };
  const targets = [mk("Work", 0), mk("Percent", 0.5), mk("Footer", 2, false)];
  const c = createSwitchController({
    now: () => now, rand: () => 0, reducedMotion: () => reduced, targets: () => targets,
    schedule: (fn, ms) => timers.push({ at: now + ms, fn }), navigate: (l) => navigations.push(l),
  });
  const advance = (to: number) => { now = to; for (const t of timers.filter((x) => x.at <= to)) { timers.splice(timers.indexOf(t), 1); t.fn(); } c.tick(now); };
  return { c, targets, writes, navigations, advance };
}

describe("language switch controller", () => {
  test("ignores a second request while switching", () => {
    const { c } = setup();
    expect(c.request("ar")).toBe(true);
    expect(c.request("en")).toBe(false);
  });
  test("navigates at 360 ms and finishes by settle time", () => {
    const { c, targets, writes, navigations, advance } = setup();
    const started: string[] = [];
    c.onStart((l) => started.push(l));
    c.request("ar");
    expect(started).toEqual(["ar"]);
    advance(359); expect(navigations).toEqual([]);
    advance(360); expect(navigations).toEqual(["ar"]);
    c.resolve(targets[0], "أعمالنا");
    advance(1500);
    expect(c.active()).toBe(false);
    expect(writes.get(targets[0])!.at(-1)).toBeNull();
    expect(writes.get(targets[1])!.at(-1)).toBeNull();
    expect(writes.get(targets[2])).toEqual([]);
  });
  test("a switch during the intro replaces the intro decode", () => {
    const { c, targets, writes, navigations, advance } = setup();
    c.decode(targets.slice(0, 2), 0, 140);
    expect(c.active()).toBe(false);
    expect(c.request("ar")).toBe(true);
    advance(1500);
    expect(navigations).toEqual(["ar"]);
    expect(c.hasJobs()).toBe(false);
    for (const t of targets.slice(0, 2)) expect(writes.get(t)!.at(-1)).toBeNull();
  });
  test("reduced motion switches at once without scramble", () => {
    const { c, navigations, writes, targets } = setup(true);
    c.request("ar");
    expect(navigations).toEqual(["ar"]);
    expect(c.hasJobs()).toBe(false);
    expect(writes.get(targets[0])).toEqual([]);
  });
});
