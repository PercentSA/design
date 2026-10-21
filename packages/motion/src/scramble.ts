export const LATIN_NOISE = "ABCDEFGHJKLMNPRSTUVWXYZabcdefghkmnprstuvwxyz0123456789#%&*/<>=+";
export const ARABIC_NOISE = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي";

const ARABIC = /[؀-ۿ]/;

/** `latin`: the noise for Latin text (ScrambleProvider `noise`); Arabic text always uses ARABIC_NOISE. */
export const noiseSetFor = (text: string, latin = LATIN_NOISE) => (ARABIC.test(text) ? ARABIC_NOISE : latin);

export const SWITCH = { flipMs: 360, staggerMaxMs: 220, settleMs: 1500 } as const;

export const resolveDuration = (text: string) => 420 + Math.min(700, 10 * [...text].length);

/** Show `from` until a, dissolve it a→flip, noise flip→b, resolve `to` b→e. */
export interface ScrambleJob {
  from: string;
  to: string;
  a: number;
  flip: number;
  b: number;
  e: number;
}

function noise(chars: string[], set: string, rand: () => number) {
  return chars.map((c) => (c === " " || c === "\n" ? c : set[Math.floor(rand() * set.length)])).join("");
}

/** The overlay text at `now`, or null when the job is done. */
export function scrambleFrame(job: ScrambleJob, now: number, rand: () => number, latin = LATIN_NOISE): string | null {
  if (now >= job.e) return null;
  if (now < job.a) return job.from;
  if (now < job.flip) {
    const chars = [...job.from];
    const keep = Math.floor(chars.length * (1 - (now - job.a) / (job.flip - job.a)));
    return chars.slice(0, keep).join("") + noise(chars.slice(keep), noiseSetFor(job.from, latin), rand);
  }
  const chars = [...job.to];
  if (now < job.b) return noise(chars, noiseSetFor(job.to, latin), rand);
  const resolved = Math.floor((chars.length * (now - job.b)) / (job.e - job.b));
  return chars.slice(0, resolved).join("") + noise(chars.slice(resolved), noiseSetFor(job.to, latin), rand);
}
