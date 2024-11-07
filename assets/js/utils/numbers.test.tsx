import * as numbers from "@/utils/numbers";

describe("limitDecimals", () => {
  test("does not change integers", () => {
    expect(numbers.limitDecimals(1, 2)).toEqual(1);
  });

  test("limits decimal expansion", () => {
    expect(numbers.limitDecimals(0.111111111111, 2)).toEqual(0.11);
  });

  test("does not leave trailing zeros", () => {
    expect(numbers.limitDecimals(0.199999999999, 2)).toEqual(0.2);
  });
});
