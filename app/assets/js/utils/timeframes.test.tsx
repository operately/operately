import * as Timeframes from "./timeframes";
import { Timeframe, ContextualDate, ContextualDateType } from "@/api";

describe("Timeframes", () => {
  // Helper function to create contextual date objects for testing
  const createContextualDate = (year: number, month: number, day: number, customValue?: string): ContextualDate => {
    const date = new Date(year, month, day).toISOString().split("T")[0]!;
    const value = customValue !== undefined ? customValue : `${month + 1}/${day}/${year}`;
    return {
      dateType: "day" as ContextualDateType,
      date,
      value
    };
  };

  // Helper function to create timeframe objects for testing
  const createTimeframe = (start: [number, number, number], end: [number, number, number]): Timeframe => {
    return {
      contextualStartDate: createContextualDate(start[0], start[1], start[2]),
      contextualEndDate: createContextualDate(end[0], end[1], end[2])
    };
  };

  describe("getTimeframeRange", () => {
    it("returns a formatted string with start and end values", () => {
      const timeframe: Partial<Timeframe> = {
        contextualStartDate: { dateType: "day" as ContextualDateType, value: "Jan 1, 2021", date: "2021-01-01" },
        contextualEndDate: { dateType: "day" as ContextualDateType, value: "Dec 31, 2021", date: "2021-12-31" }
      };

      expect(Timeframes.getTimeframeRange(timeframe as Timeframe)).toBe("Jan 1, 2021 - Dec 31, 2021");
    });

    it("handles null/undefined values safely", () => {
      const timeframe = {} as unknown as Timeframe;
      expect(Timeframes.getTimeframeRange(timeframe)).toBe("undefined - undefined");

      const partialTimeframe = {
        contextualStartDate: { dateType: "day" as ContextualDateType, value: "Jan 1, 2021", date: "2021-01-01" }
      } as unknown as Timeframe;
      expect(Timeframes.getTimeframeRange(partialTimeframe)).toBe("Jan 1, 2021 - undefined");
    });
  });

  describe("dayCount", () => {
    it("calculates correct day count between dates", () => {
      const timeframe = createTimeframe([2021, 0, 1], [2021, 0, 10]);
      // 10 days from Jan 1 to Jan 10 (inclusive)
      expect(Timeframes.dayCount(timeframe)).toBe(9);
    });

    it("returns 0 for missing dates", () => {
      const emptyTimeframe = {} as unknown as Timeframe;
      expect(Timeframes.dayCount(emptyTimeframe)).toBe(0);

      const partialTimeframe = {
        contextualStartDate: createContextualDate(2021, 0, 1)
      } as unknown as Timeframe;
      expect(Timeframes.dayCount(partialTimeframe)).toBe(0);
    });
  });

  describe("hasOverlap", () => {
    // Test window is March 1, 2021 to June 1, 2021
    const w = createTimeframe([2021, 2, 1], [2021, 5, 1]);

    // Various test cases with different overlaps
    const a = createTimeframe([2021, 1, 1], [2021, 6, 1]);  // Feb 1 - July 1 (surrounds)
    const b = createTimeframe([2021, 0, 1], [2021, 1, 15]); // Jan 1 - Feb 15 (ends before)
    const c = createTimeframe([2021, 1, 1], [2021, 3, 15]); // Feb 1 - Apr 15 (overlaps start)
    const d = createTimeframe([2021, 3, 1], [2021, 4, 15]); // Apr 1 - May 15 (contained within)
    const e = createTimeframe([2021, 3, 15], [2021, 6, 1]); // Apr 15 - Jul 1 (overlaps end)
    const f = createTimeframe([2021, 6, 1], [2021, 7, 15]); // Jul 1 - Aug 15 (after)

    test("correctly detects surrounding overlap", () => {
      expect(Timeframes.hasOverlap(w, a)).toBe(true);
    });

    test("correctly detects no overlap when ends before", () => {
      expect(Timeframes.hasOverlap(w, b)).toBe(false);
    });

    test("correctly detects overlap at start", () => {
      expect(Timeframes.hasOverlap(w, c)).toBe(true);
    });

    test("correctly detects contained overlap", () => {
      expect(Timeframes.hasOverlap(w, d)).toBe(true);
    });

    test("correctly detects overlap at end", () => {
      expect(Timeframes.hasOverlap(w, e)).toBe(true);
    });

    test("correctly detects no overlap when starts after", () => {
      expect(Timeframes.hasOverlap(w, f)).toBe(false);
    });
  });

  describe("hasOverlap", () => {
    it("returns true when two timeframes overlap", () => {
      const timeframeA = createTimeframe([2021, 0, 1], [2021, 0, 10]);
      const timeframeB = createTimeframe([2021, 0, 5], [2021, 0, 15]);
      expect(Timeframes.hasOverlap(timeframeA, timeframeB)).toBe(true);
    });

    it("returns false when two timeframes don't overlap", () => {
      const timeframeA = createTimeframe([2021, 0, 1], [2021, 0, 10]);
      const timeframeB = createTimeframe([2021, 0, 11], [2021, 0, 20]);
      expect(Timeframes.hasOverlap(timeframeA, timeframeB)).toBe(false);
    });

    it("returns false when either timeframe is missing dates", () => {
      const timeframeA = createTimeframe([2021, 0, 1], [2021, 0, 10]);
      const emptyTimeframe = {} as unknown as Timeframe;
      expect(Timeframes.hasOverlap(timeframeA, emptyTimeframe)).toBe(false);
      expect(Timeframes.hasOverlap(emptyTimeframe, timeframeA)).toBe(false);
    });
  });

  describe("equalDates", () => {
    it("returns true when timeframes have the same dates", () => {
      const timeframeA = createTimeframe([2021, 0, 1], [2021, 0, 10]);
      const timeframeB = createTimeframe([2021, 0, 1], [2021, 0, 10]);
      expect(Timeframes.equalDates(timeframeA, timeframeB)).toBe(true);
    });

    it("returns false when timeframes have different dates", () => {
      const timeframeA = createTimeframe([2021, 0, 1], [2021, 0, 10]);
      const timeframeB = createTimeframe([2021, 0, 2], [2021, 0, 11]);
      expect(Timeframes.equalDates(timeframeA, timeframeB)).toBe(false);
    });
  });

  describe("compareDuration", () => {
    it("returns -1 when first timeframe is longer", () => {
      const longer = createTimeframe([2021, 0, 1], [2021, 11, 31]);
      const shorter = createTimeframe([2021, 0, 1], [2021, 6, 30]);
      
      expect(Timeframes.compareDuration(longer, shorter)).toBe(-1);
    });

    it("returns 1 when second timeframe is longer", () => {
      const shorter = createTimeframe([2021, 0, 1], [2021, 6, 30]);
      const longer = createTimeframe([2021, 0, 1], [2021, 11, 31]);
      
      expect(Timeframes.compareDuration(shorter, longer)).toBe(1);
    });

    it("returns 0 when timeframes are equal duration", () => {
      const timeframe1 = createTimeframe([2021, 0, 1], [2021, 11, 31]);
      const timeframe2 = createTimeframe([2022, 0, 1], [2022, 11, 31]);
      
      expect(Timeframes.compareDuration(timeframe1, timeframe2)).toBe(0);
    });

    it("handles missing dates", () => {
      const timeframe1 = createTimeframe([2021, 0, 1], [2021, 11, 31]);
      const timeframe2 = {} as Timeframe;
      
      expect(Timeframes.compareDuration(timeframe1, timeframe2)).toBe(0);
    });
  });
});
