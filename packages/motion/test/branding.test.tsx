// 0.4.0 brand settings in motion: the slash angle from CSS, the scramble noise, primary for selected states.
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { useRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ScrambleProvider, ScrambleText, SLASH_RUN, SlashReveal, useScramble, useSuccessWipe, type ScrambleApi, type ScrambleTarget } from "../src";
import { mount, useDom } from "../../ui/test/dom";

useDom();

const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
const rule = (sel: string) => css.split(`\n  ${sel} {`)[1]!.split("}")[0]!;

const saved = { matchMedia: globalThis.matchMedia, raf: globalThis.requestAnimationFrame };
beforeEach(() => {
  globalThis.matchMedia = ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} })) as unknown as typeof matchMedia;
  globalThis.requestAnimationFrame = () => 0;
});
afterEach(() => {
  globalThis.matchMedia = saved.matchMedia;
  globalThis.requestAnimationFrame = saved.raf;
});

test("SlashReveal server HTML carries the aspect, CSS makes the run", () => {
  const out = renderToStaticMarkup(<SlashReveal aspect={4 / 3}><img alt="" /></SlashReveal>);
  expect(out).toContain("--p-aspect:1.3333");
  expect(out).not.toContain("--p-run");
  expect(css).toContain("calc(var(--p-slash-run) / var(--p-aspect) * 100%)");
});

describe("success wipe reads the CSS angle", () => {
  let wipe: (onCovered: () => void) => void = () => {};
  function Box() {
    const box = useRef<HTMLDivElement>(null);
    const band = useRef<HTMLSpanElement>(null);
    wipe = useSuccessWipe(box, band);
    return (
      <div ref={box} id="box">
        <span ref={band} className="p-wipe" />
      </div>
    );
  }
  const run = async (slashRun?: string) => {
    const root = await mount(<Box />);
    const box = root.querySelector<HTMLElement>("#box")!;
    const band = box.firstElementChild as HTMLElement;
    Object.defineProperties(box, { offsetWidth: { value: 200 }, offsetHeight: { value: 100 } });
    band.animate = (() => ({ finished: new Promise(() => {}), cancel() {} })) as unknown as typeof band.animate;
    // happy-dom does not inherit custom properties, so the value goes on the box (a browser inherits it from :root).
    if (slashRun !== undefined) box.style.setProperty("--p-slash-run", slashRun);
    wipe(() => {});
    return band.style.width;
  };
  test("--p-slash-run: 0 gives a vertical edge", async () => {
    expect(await run("0")).toBe("200px");
  });
  test("unset: the JS SLASH_RUN", async () => {
    expect(parseFloat(await run())).toBeCloseTo(200 + 2 * 100 * SLASH_RUN, 2);
  });
});

test("ScrambleProvider noise: Latin noise comes from the noise prop", async () => {
  let api: ScrambleApi | undefined;
  let target: ScrambleTarget | null = null;
  const Grab = () => ((api = useScramble()), null);
  const text = "Percent studio";
  const root = await mount(
    <ScrambleProvider navigate={() => {}} noise="ab">
      <Grab />
      <ScrambleText targetRef={(t) => (target = t)}>{text}</ScrambleText>
    </ScrambleProvider>,
  );
  api!.decode([target!], performance.now(), 0);
  const frame = root.querySelector(".p-sx-f")!.textContent!;
  expect(frame.length).toBeGreaterThan(0);
  expect([...frame].filter((c) => !`ab${text}`.includes(c))).toEqual([]);
});

test("selected states use primary in motion CSS", () => {
  expect(rule(".p-wipe")).toContain("background: var(--p-primary);");
  expect(rule(".p-scene-dot i")).toContain("background: var(--p-primary);");
});
