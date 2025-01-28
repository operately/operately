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

describe("findOrdinalNumberSuffix", () => {
  it('should return "st" for numbers ending in 1 (except 11)', () => {
    expect(numbers.findOrdinalNumberSuffix(1)).toBe("st");
    expect(numbers.findOrdinalNumberSuffix(21)).toBe("st");
    expect(numbers.findOrdinalNumberSuffix(101)).toBe("st");
  });

  it('should return "nd" for numbers ending in 2 (except 12)', () => {
    expect(numbers.findOrdinalNumberSuffix(2)).toBe("nd");
    expect(numbers.findOrdinalNumberSuffix(22)).toBe("nd");
    expect(numbers.findOrdinalNumberSuffix(102)).toBe("nd");
  });

  it('should return "rd" for numbers ending in 3 (except 13)', () => {
    expect(numbers.findOrdinalNumberSuffix(3)).toBe("rd");
    expect(numbers.findOrdinalNumberSuffix(23)).toBe("rd");
    expect(numbers.findOrdinalNumberSuffix(103)).toBe("rd");
  });

  it('should return "th" for numbers ending in 11, 12, or 13', () => {
    expect(numbers.findOrdinalNumberSuffix(11)).toBe("th");
    expect(numbers.findOrdinalNumberSuffix(12)).toBe("th");
    expect(numbers.findOrdinalNumberSuffix(13)).toBe("th");
    expect(numbers.findOrdinalNumberSuffix(111)).toBe("th");
    expect(numbers.findOrdinalNumberSuffix(112)).toBe("th");
    expect(numbers.findOrdinalNumberSuffix(113)).toBe("th");
  });

  it('should return "th" for numbers ending in 0, 4-9', () => {
    expect(numbers.findOrdinalNumberSuffix(0)).toBe("th");
    expect(numbers.findOrdinalNumberSuffix(4)).toBe("th");
    expect(numbers.findOrdinalNumberSuffix(5)).toBe("th");
    expect(numbers.findOrdinalNumberSuffix(6)).toBe("th");
    expect(numbers.findOrdinalNumberSuffix(7)).toBe("th");
    expect(numbers.findOrdinalNumberSuffix(8)).toBe("th");
    expect(numbers.findOrdinalNumberSuffix(9)).toBe("th");
    expect(numbers.findOrdinalNumberSuffix(10)).toBe("th");
    expect(numbers.findOrdinalNumberSuffix(14)).toBe("th");
    expect(numbers.findOrdinalNumberSuffix(20)).toBe("th");
    expect(numbers.findOrdinalNumberSuffix(104)).toBe("th");
  });
});
