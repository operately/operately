import * as Timeframes from "./timeframes";

describe("Timeframes", () => {
  describe("firstQuarterOfYear", () => {
    it("returns the first quarter of the year", () => {
      expect(Timeframes.firstQuarterOfYear(2021)).toEqual({
        startDate: new Date(2021, 0, 1),
        endDate: new Date(2021, 2, 31),
        type: "quarter",
      });
    });
  });

  describe("secondQuarterOfYear", () => {
    it("returns the second quarter of the year", () => {
      expect(Timeframes.secondQuarterOfYear(2021)).toEqual({
        startDate: new Date(2021, 3, 1),
        endDate: new Date(2021, 5, 30),
        type: "quarter",
      });
    });
  });

  describe("thirdQuarterOfYear", () => {
    it("returns the third quarter of the year", () => {
      expect(Timeframes.thirdQuarterOfYear(2021)).toEqual({
        startDate: new Date(2021, 6, 1),
        endDate: new Date(2021, 8, 30),
        type: "quarter",
      });
    });
  });

  describe("fourthQuarterOfYear", () => {
    it("returns the fourth quarter of the year", () => {
      expect(Timeframes.fourthQuarterOfYear(2021)).toEqual({
        startDate: new Date(2021, 9, 1),
        endDate: new Date(2021, 11, 31),
        type: "quarter",
      });
    });
  });

  describe("hasOverlap", () => {
    //
    // window        ###############
    //               #             #
    // a:         |--#-------------#--|              overlap
    // b: |-----|    #             #                 no overlap
    // c:   |--------#-|           #                 overlap
    // d:            # |---------| #                 overlap
    // e:            #      |------#---|             overlap
    // f:            #             #  |-------|      no overlap
    //               ###############
    //

    const w = create([2021, 2, 1], [2021, 5, 1], "days");

    const a = create([2021, 1, 1], [2021, 6, 1], "days");
    const b = create([2021, 1, 1], [2021, 1, 15], "days");
    const c = create([2021, 1, 1], [2021, 3, 15], "days");
    const d = create([2021, 3, 1], [2021, 4, 15], "days");
    const e = create([2021, 3, 15], [2021, 6, 1], "days");
    const f = create([2021, 6, 1], [2021, 7, 15], "days");

    test("starts before, ends after", () => {
      expect(Timeframes.hasOverlap(w, a)).toBe(true);
    });

    test("starts before, ends before", () => {
      expect(Timeframes.hasOverlap(w, b)).toBe(false);
    });

    test("starts before, ends inside", () => {
      expect(Timeframes.hasOverlap(w, c)).toBe(true);
    });

    test("starts inside, ends inside", () => {
      expect(Timeframes.hasOverlap(w, d)).toBe(true);
    });

    test("starts inside, ends after", () => {
      expect(Timeframes.hasOverlap(w, e)).toBe(true);
    });

    test("starts after, ends after", () => {
      expect(Timeframes.hasOverlap(w, f)).toBe(false);
    });
  });
});

function create(
  startDate: [number, number, number],
  endDate: [number, number, number],
  type: Timeframes.TimeframeType,
) {
  return {
    startDate: new Date(startDate[0], startDate[1], startDate[2]),
    endDate: new Date(endDate[0], endDate[1], endDate[2]),
    type,
  };
}
