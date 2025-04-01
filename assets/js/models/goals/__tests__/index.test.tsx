import { targetProgressPercentage } from "../index";
import { Target } from "@/api";

describe("targetProgressPercentage", () => {
  describe("ascending targets (from < to)", () => {
    const makeTarget = (value: number): Target => ({
      from: 0,
      to: 100,
      value,
    });

    test("returns 0% when value equals from", () => {
      expect(targetProgressPercentage(makeTarget(0))).toBe(0);
    });

    test("returns 100% when value equals to", () => {
      expect(targetProgressPercentage(makeTarget(100))).toBe(100);
    });

    test("returns 50% when value is halfway", () => {
      expect(targetProgressPercentage(makeTarget(50))).toBe(50);
    });

    test("clamps values below 0% by default", () => {
      expect(targetProgressPercentage(makeTarget(-50))).toBe(0);
    });

    test("clamps values above 100% by default", () => {
      expect(targetProgressPercentage(makeTarget(150))).toBe(100);
    });

    test("allows values below 0% when unclamped", () => {
      expect(targetProgressPercentage(makeTarget(-50), false)).toBe(-50);
    });

    test("allows values above 100% when unclamped", () => {
      expect(targetProgressPercentage(makeTarget(150), false)).toBe(150);
    });
  });

  describe("descending targets (from > to)", () => {
    const makeTarget = (value: number): Target => ({
      from: 100,
      to: 0,
      value,
    });

    test("returns 0% when value equals from", () => {
      expect(targetProgressPercentage(makeTarget(100))).toBe(0);
    });

    test("returns 100% when value equals to", () => {
      expect(targetProgressPercentage(makeTarget(0))).toBe(100);
    });

    test("returns 50% when value is halfway", () => {
      expect(targetProgressPercentage(makeTarget(50))).toBe(50);
    });

    test("clamps values below 0% by default", () => {
      expect(targetProgressPercentage(makeTarget(150))).toBe(0);
    });

    test("clamps values above 100% by default", () => {
      expect(targetProgressPercentage(makeTarget(-50))).toBe(100);
    });

    test("allows values below 0% when unclamped", () => {
      expect(targetProgressPercentage(makeTarget(150), false)).toBe(-50);
    });

    test("allows values above 100% when unclamped", () => {
      expect(targetProgressPercentage(makeTarget(-50), false)).toBe(150);
    });


  });
});
