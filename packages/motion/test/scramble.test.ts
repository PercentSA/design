import { describe, expect, test } from "bun:test";
import { scrambleFrame, resolveDuration, noiseSetFor, ARABIC_NOISE, LATIN_NOISE } from "../src";

const r = () => 0;
const job = { from: "Work us", to: "أعمالنا", a: 0, flip: 360, b: 400, e: 800 };

describe("scramble", () => {
  test("phases", () => {
    expect(scrambleFrame(job, -1, r)).toBe("Work us");
    const mid = scrambleFrame(job, 180, r)!;
    expect([...mid]).toHaveLength(7);
    expect(mid.startsWith("Wor")).toBe(true);
    expect(mid[4]).toBe(" ");
    expect([...scrambleFrame(job, 380, r)!].every((c) => ARABIC_NOISE.includes(c))).toBe(true);
    expect(scrambleFrame(job, 799, r)!.startsWith("أعمالن")).toBe(true);
    expect(scrambleFrame(job, 800, r)).toBeNull();
  });
  test("intro job starts empty", () => {
    expect(scrambleFrame({ from: "", to: "Hi", a: 100, flip: 100, b: 100, e: 300 }, 50, r)).toBe("");
  });
  test("helpers", () => {
    expect(resolveDuration("abc")).toBe(450);
    expect(resolveDuration("x".repeat(500))).toBe(1120);
    expect(noiseSetFor("Percent — استوديو")).toBe(ARABIC_NOISE);
    expect(noiseSetFor("Percent")).toBe(LATIN_NOISE);
  });
});
