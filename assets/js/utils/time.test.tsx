import * as Time from "./time";

describe("Time.parse", () => {
  it("parses date strings without time", () => {
    expect(Time.parse("2020-01-01")).toEqual(new Date(2020, 0, 1));
  });

  it("is idempotent", () => {
    let date = new Date(2020, 0, 1);

    expect(Time.parse(date)).toEqual(date);
  });

  it("throws an error if the date is invalid", () => {
    expect(() => Time.parse("invalid date")).toThrow();
  });

  it("returns null if the date is null", () => {
    expect(Time.parse(null)).toBeNull();
  });
});

describe("Time.toDateWithoutTime", () => {
  it("converts to a date without time", () => {
    let date = Time.parse("Wed Sep 27 2023 00:00:00")!;

    expect(Time.toDateWithoutTime(date)).toEqual("2023-09-27");
  });
});
