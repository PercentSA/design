import { describe, expect, test } from "bun:test";
import { magnetOffset } from "../src";

describe("magnetic buttons", () => {
  test("move a quarter of the way to the pointer, at most 6 px per axis", () => {
    expect(magnetOffset(40, 0)).toEqual({ x: 6, y: 0 });
    expect(magnetOffset(8, -8)).toEqual({ x: 2, y: -2 });
    expect(magnetOffset(-100, 100)).toEqual({ x: -6, y: 6 });
  });
});
