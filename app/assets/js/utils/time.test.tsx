import { addDays } from "date-fns";
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
    let date = Time.parse("2023-09-27T00:00:00Z");

    expect(Time.toDateWithoutTime(date!)).toEqual("2023-09-27");
  });
});

describe("Time.durationHumanized", () => {
  test("it returns the duration in humanized format", () => {
    const today = new Date(2023, 9, 27);

    expect(Time.durationHumanized(today, today, "remaining")).toEqual("Last day");

    // switch to days after 1 day
    expect(Time.durationHumanized(today, addDays(today, 1), "remaining")).toEqual("1 day remaining");
    expect(Time.durationHumanized(today, addDays(today, 2), "remaining")).toEqual("2 days remaining");
    expect(Time.durationHumanized(today, addDays(today, 7), "remaining")).toEqual("7 days remaining");
    expect(Time.durationHumanized(today, addDays(today, 10), "remaining")).toEqual("10 days remaining");

    // switch to weeks after 14 days
    expect(Time.durationHumanized(today, addDays(today, 14), "remaining")).toEqual("2 weeks remaining");
    expect(Time.durationHumanized(today, addDays(today, 21), "remaining")).toEqual("3 weeks remaining");
    expect(Time.durationHumanized(today, addDays(today, 28), "remaining")).toEqual("4 weeks remaining");
    expect(Time.durationHumanized(today, addDays(today, 35), "remaining")).toEqual("5 weeks remaining");
    expect(Time.durationHumanized(today, addDays(today, 42), "remaining")).toEqual("6 weeks remaining");

    // switch to months after 60 days
    expect(Time.durationHumanized(today, addDays(today, 60), "remaining")).toEqual("2 months remaining");
    expect(Time.durationHumanized(today, addDays(today, 100), "remaining")).toEqual("3 months remaining");
    expect(Time.durationHumanized(today, addDays(today, 140), "remaining")).toEqual("4 months remaining");

    // switch to years after 365 days
    expect(Time.durationHumanized(today, addDays(today, 400), "remaining")).toEqual("1 year remaining");
    expect(Time.durationHumanized(today, addDays(today, 800), "remaining")).toEqual("2 years remaining");
  });
});
