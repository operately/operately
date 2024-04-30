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
});
