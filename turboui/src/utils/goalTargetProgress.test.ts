import {
  calculateTargetProgress,
  formatTargetValueSummary,
  formatValueAndUnit,
} from "./goalTargetProgress";

describe("goalTargetProgress", () => {
  describe("calculateTargetProgress", () => {
    it("returns clamped progress for increasing targets", () => {
      expect(calculateTargetProgress({ from: 0, to: 100, value: 40 })).toBe(40);
      expect(calculateTargetProgress({ from: 0, to: 100, value: 150 })).toBe(100);
      expect(calculateTargetProgress({ from: 0, to: 100, value: -10 })).toBe(0);
    });

    it("supports decreasing targets and unclamped values", () => {
      expect(calculateTargetProgress({ from: 100, to: 0, value: 25 })).toBe(75);
      expect(calculateTargetProgress({ from: 0, to: 100, value: 150 }, false)).toBe(150);
    });

    it("returns 0 when from equals to", () => {
      expect(calculateTargetProgress({ from: 10, to: 10, value: 10 })).toBe(0);
    });
  });

  describe("formatValueAndUnit", () => {
    it("formats with locale separators and units", () => {
      expect(formatValueAndUnit(1000, "USD", "en-US")).toBe("1,000 USD");
      expect(formatValueAndUnit(40, "%", "en-US")).toBe("40%");
      expect(formatValueAndUnit(1000.5, "", "de-DE")).toBe("1.000,5");
    });
  });

  describe("formatTargetValueSummary", () => {
    it("returns null when value or target is missing", () => {
      expect(formatTargetValueSummary({ value: 10, to: null, unit: "USD" })).toBeNull();
      expect(formatTargetValueSummary({ value: null, to: 100, unit: "%" })).toBeNull();
    });

    it("formats current → target summary", () => {
      expect(formatTargetValueSummary({ value: 250, to: 1000, unit: "USD" }, "en-US")).toBe("250 USD → 1,000 USD");
      expect(formatTargetValueSummary({ value: 40, to: 100, unit: "%" }, "en-US")).toBe("40% → 100%");
    });
  });
});
