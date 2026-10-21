import { SWITCH, resolveDuration, scrambleFrame, type ScrambleJob } from "./scramble";

export interface ScrambleTarget {
  text(): string;
  /** Position of the element's top edge, 0..1 of the viewport height. */
  top(): number;
  onScreen(): boolean;
  /** null = done: show the real text again. */
  write(s: string | null): void;
}

export interface SwitchDeps {
  now(): number;
  schedule(fn: () => void, ms: number): void;
  navigate(next: string): void;
  reducedMotion(): boolean;
  targets(): Iterable<ScrambleTarget>;
  rand(): number;
  /** Noise characters for Latin text (default LATIN_NOISE). */
  noise?: string;
}

export interface SwitchController {
  request(next: string): boolean;
  resolve(t: ScrambleTarget, newText: string): void;
  decode(list: ScrambleTarget[], startAt: number, gapMs: number, durationOf?: (text: string) => number): void;
  tick(now: number): void;
  active(): boolean;
  hasJobs(): boolean;
  onStart(fn: (next: string) => void): () => void;
}

export function createSwitchController(deps: SwitchDeps): SwitchController {
  const jobs = new Map<ScrambleTarget, ScrambleJob>();
  const listeners = new Set<(next: string) => void>();
  let switching = false;

  return {
    request(next) {
      if (switching) return false;
      if (deps.reducedMotion()) {
        deps.navigate(next);
        return true;
      }
      switching = true;
      for (const fn of listeners) fn(next);
      const now = deps.now();
      const flip = now + SWITCH.flipMs;
      for (const t of deps.targets()) {
        if (!t.onScreen()) continue;
        const d = Math.min(1, Math.max(0, t.top())) * SWITCH.staggerMaxMs;
        const text = t.text();
        const b = flip + d;
        // `to` is the old text until the new language renders and calls resolve().
        jobs.set(t, { from: text, to: text, a: now + d * 0.2, flip, b, e: b + resolveDuration(text) });
      }
      deps.schedule(() => deps.navigate(next), SWITCH.flipMs);
      // Long strings may still be resolving; they finish on their own in tick().
      deps.schedule(() => (switching = false), SWITCH.settleMs);
      return true;
    },
    resolve(t, newText) {
      const job = jobs.get(t);
      if (!job) return;
      job.to = newText;
      job.e = job.b + resolveDuration(newText);
    },
    decode(list, startAt, gapMs, durationOf = resolveDuration) {
      if (deps.reducedMotion()) return list.forEach((t) => t.write(null));
      list.forEach((t, i) => {
        const at = startAt + i * gapMs;
        const text = t.text();
        jobs.set(t, { from: "", to: text, a: at, flip: at, b: at, e: at + durationOf(text) });
      });
    },
    tick(now) {
      for (const [t, job] of jobs) {
        const s = scrambleFrame(job, now, deps.rand, deps.noise);
        t.write(s);
        if (s === null) jobs.delete(t);
      }
    },
    active: () => switching,
    hasJobs: () => jobs.size > 0,
    onStart(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
