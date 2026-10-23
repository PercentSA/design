// Writes the logo videos from the loader frames in packages/tokens/src/logo-motion.ts: every frame is the
// <LogoLoader> markup at one time, rendered with rsvg-convert, then encoded with ffmpeg (libx264, libvpx-vp9, prores_ks).
// MP4 and WebM go to apps/docs/public/brand-video (committed). The transparent MOV files (ProRes 4444, about 55 MB)
// go to build/brand-video and then to the GitHub release "brand-video" (the Brand page links there), not to git.
// After a logo change: bun run logo-videos && gh release upload brand-video build/brand-video/*.mov --clobber
import { mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { LOADER_VIEWBOX, LOGO_STROKE, logoLoaderFrame } from "../packages/tokens/src/index.ts";

export const FPS = 60;
const HOLD = 2000; // the loader time at which a word is still: Arabic 2000, English 3600 + 2000
/** Loader time (ms) of each video frame. */
export const VIDEOS = {
  // logo → Arabic → logo → English → logo; frame 432 would be frame 0 again, so it loops without a jump.
  loop: Array.from({ length: 7.2 * FPS }, (_, i) => (i * 1000) / FPS),
  // logo → the word, then the still word: 3 s.
  ar: Array.from({ length: 3 * FPS }, (_, i) => Math.min((i * 1000) / FPS, HOLD)),
  en: Array.from({ length: 3 * FPS }, (_, i) => 3600 + Math.min((i * 1000) / FPS, HOLD)),
} as const;
export type VideoName = keyof typeof VIDEOS;

/** Frame sizes: [width, height, share of the width the loader box takes]. "alpha" is the loader box alone, on a transparent background. */
export const SIZES = { "16x9": [1920, 1080, 0.6], "1x1": [1080, 1080, 0.8], "9x16": [1080, 1920, 0.8], alpha: [1860, 600, 1] } as const;
export type SizeName = keyof typeof SIZES;

/** One frame as SVG: the logo in white on a transparent background, the loader box centred. */
export function frameSvg(ms: number, [w, h, share]: readonly [number, number, number]) {
  const f = logoLoaderFrame(ms), [x, y, bw, bh] = LOADER_VIEWBOX;
  const k = (w * share) / bw, vw = w / k, vh = h / k; // view box of the whole frame, in logo units
  const vb = [x + bw / 2 - vw / 2, y + bh / 2 - vh / 2, vw, vh].map((n) => +n.toFixed(3));
  const p = (ds: string[]) => ds.map((d) => `<path d="${d}"/>`).join("");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(" ")}" width="${w}" height="${h}">` +
    `<defs><clipPath id="l"><polygon points="${f.clipLeft}"/></clipPath><clipPath id="r"><polygon points="${f.clipRight}"/></clipPath></defs>` +
    `<g transform="translate(${f.camera.toFixed(2)} 0)" fill="#fff" stroke="#fff" stroke-width="${LOGO_STROKE}" stroke-linejoin="round">` +
    `${p(f.main)}<g clip-path="url(#l)">${p(f.left)}</g><g clip-path="url(#r)">${p(f.right)}</g></g></svg>`
  );
}

/** The files the script writes: "web" in the repo, "editor" (transparent MOV) for the release. */
export function videoFiles(kind: "web" | "editor") {
  const out: string[] = [];
  for (const v of Object.keys(VIDEOS) as VideoName[])
    for (const s of Object.keys(SIZES) as SizeName[])
      for (const c of ["white", "black"])
        if (s === "alpha") kind === "editor" && out.push(`percent-${v}-${s}-${c}.mov`);
        else kind === "web" && out.push(`percent-${v}-${s}-${c}.mp4`, `percent-${v}-${s}-${c}.webm`);
  return out.sort();
}

async function run(cmd: string[]) {
  const p = Bun.spawn(cmd, { stdout: "ignore", stderr: "pipe" });
  if ((await p.exited) !== 0) throw new Error(`${cmd[0]} failed: ${await new Response(p.stderr).text()}`);
}

/** Runs the jobs, at most n at a time. */
async function pool<T>(items: T[], n: number, job: (t: T) => Promise<void>) {
  let next = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (next < items.length) await job(items[next++]!);
  }));
}

if (import.meta.main) {
  const DIR = resolve(import.meta.dir, "../apps/docs/public/brand-video"), MOV = resolve(import.meta.dir, "../build/brand-video");
  const only = process.argv.slice(2); // optional: video names to make, for a quick try
  mkdirSync(DIR, { recursive: true });
  mkdirSync(MOV, { recursive: true });
  const tmp = mkdtempSync(join(tmpdir(), "logo-videos-"));
  try {
    for (const v of (only.length ? only : Object.keys(VIDEOS)) as VideoName[])
      for (const s of Object.keys(SIZES) as SizeName[]) {
        const frames = join(tmp, `${v}-${s}`);
        mkdirSync(frames);
        await pool([...VIDEOS[v].keys()], navigator.hardwareConcurrency, async (i) => {
          const svg = join(frames, `${i}.svg`);
          await Bun.write(svg, frameSvg(VIDEOS[v][i]!, SIZES[s]));
          await run(["rsvg-convert", svg, "-o", join(frames, `${String(i).padStart(4, "0")}.png`)]);
        });
        const [w, h] = SIZES[s];
        const input = ["-framerate", String(FPS), "-i", join(frames, "%04d.png")];
        const black = "[0]lutrgb=r=0:g=0:b=0[k];"; // the shapes in black, alpha kept
        for (const c of ["white", "black"] as const) {
          const name = join(s === "alpha" ? MOV : DIR, `percent-${v}-${s}-${c}`);
          if (s === "alpha") {
            // One flat colour everywhere: the alpha carries the shape (half the size of white shapes on black pixels).
            const flat = c === "white" ? "lutrgb=r=255:g=255:b=255" : "lutrgb=r=0:g=0:b=0";
            await run(["ffmpeg", "-y", "-loglevel", "error", ...input, "-vf", flat, "-c:v", "prores_ks", "-profile:v", "4444", "-pix_fmt", "yuva444p10le", `${name}.mov`]);
            continue;
          }
          const bg = ["-f", "lavfi", "-i", `color=${c === "white" ? "black" : "white"}:s=${w}x${h}:r=${FPS}`];
          const graph = c === "white" ? "[1][0]overlay=shortest=1,format=yuv420p" : `${black}[1][k]overlay=shortest=1,format=yuv420p`;
          await run(["ffmpeg", "-y", "-loglevel", "error", ...input, ...bg, "-filter_complex", graph, "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-movflags", "+faststart", `${name}.mp4`]);
          await run(["ffmpeg", "-y", "-loglevel", "error", ...input, ...bg, "-filter_complex", graph, "-c:v", "libvpx-vp9", "-crf", "32", "-b:v", "0", "-row-mt", "1", `${name}.webm`]);
        }
        rmSync(frames, { recursive: true });
      }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  console.log(`logo videos: ${readdirSync(DIR).length} in ${DIR}, ${readdirSync(MOV).length} in ${MOV}`);
}
