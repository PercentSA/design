import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { findPage } from "../app/docs/catalogue";
import { LINK, RELEASES } from "../app/docs/changelog";

const CHANGELOG = await Bun.file(resolve(import.meta.dir, "../../../CHANGELOG.md")).text();

describe("docs changelog page", () => {
  test("one entry per version in CHANGELOG.md, in the same order", () => {
    const versions = [...CHANGELOG.matchAll(/^## (\d+\.\d+\.\d+)$/gm)].map((m) => m[1]);
    expect(RELEASES.map((r) => r.version)).toEqual(versions);
  });
  test("every version has a summary and at least one change", () => {
    const texts = RELEASES.flatMap((r) => [r.summary, ...r.changes.map((c) => c.text)]);
    expect(texts.filter((t) => !t.trim())).toEqual([]);
    expect(RELEASES.filter((r) => r.changes.length === 0).map((r) => r.version)).toEqual([]);
  });
  test("every linked component name opens an existing component page", () => {
    const pageSlugs = RELEASES.flatMap((r) => r.changes.flatMap((c) => [...c.text.matchAll(new RegExp(LINK, "g"))].map((m) => m[2])));
    const fileSlugs = [...CHANGELOG.matchAll(/\]\(https:\/\/design\.percent\.sa\/en\/components\/([^)]+)\)/g)].map((m) => m[1]);
    expect(pageSlugs.length).toBeGreaterThan(0);
    expect(fileSlugs.length).toBeGreaterThan(0);
    expect([...pageSlugs, ...fileSlugs].filter((s) => !findPage(s))).toEqual([]);
  });
  test("dates: YYYY-MM-DD, newest first; only the newest version may be unreleased", () => {
    const dated = RELEASES.filter((r) => r.date);
    expect(dated.every((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date!))).toBe(true);
    expect(dated.map((r) => r.date)).toEqual(dated.map((r) => r.date).sort().reverse());
    expect(RELEASES.slice(1).filter((r) => !r.date).map((r) => r.version)).toEqual([]);
  });
});
