import { describe, expect, test } from "bun:test";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { logoLoaderFrame, type LoaderFrame } from "../packages/tokens/src";
import { FPS, frameSvg, SIZES, VIDEOS, videoFiles } from "../scripts/logo-videos";

const paths = (f: LoaderFrame) => [...f.main, ...f.left, ...f.right].sort();
const at = (ms: number) => paths(logoLoaderFrame(ms));
const ICON = at(0), ARABIC = at(2000), ENGLISH = at(5600);

describe("logo videos", () => {
  test("the loop: 7.2 s at 60 fps, from the still icon; the next frame would be the first again", () => {
    expect(VIDEOS.loop.length).toBe(432);
    expect(at(VIDEOS.loop[0]!)).toEqual(ICON);
    expect(at(VIDEOS.loop.at(-1)! + 1000 / FPS)).toEqual(ICON);
  });

  test("each word: 3 s from the still icon to the still word", () => {
    for (const [v, word] of [["ar", ARABIC], ["en", ENGLISH]] as const) {
      expect(VIDEOS[v].length).toBe(180);
      expect(at(VIDEOS[v][0]!)).toEqual(ICON);
      expect(at(VIDEOS[v].at(-1)!)).toEqual(word);
      expect(at(VIDEOS[v].at(-60)!)).toEqual(word); // the last second holds the word
    }
  });

  test("a frame: the frame size, white shapes, no background", () => {
    const svg = frameSvg(2000, SIZES["9x16"]);
    expect(svg).toContain('width="1080" height="1920"');
    expect(svg).toContain('fill="#fff"');
    expect(svg).not.toContain("<rect");
  });

  test("the repo has every MP4 and WebM file, and no other file", () => {
    expect(readdirSync(resolve(import.meta.dir, "../apps/docs/public/brand-video")).sort()).toEqual(videoFiles("web"));
    expect(videoFiles("web").length).toBe(36);
    expect(videoFiles("editor").length).toBe(6);
  });
});
