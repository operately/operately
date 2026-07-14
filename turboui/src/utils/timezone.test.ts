import { dateInTimezone, zonedDateTimeToDate } from "./timezone";

describe("timezone utilities", () => {
  it("converts wall-clock fields into the matching instant in the target timezone", () => {
    const date = zonedDateTimeToDate(
      { year: 2026, month: 7, day: 16, hour: 20, minute: 0, second: 0 },
      "America/Los_Angeles",
    );

    expect(date).toEqual(new Date("2026-07-17T03:00:00.000Z"));
  });

  it("returns the target timezone's wall-clock fields for an instant", () => {
    const date = dateInTimezone(new Date("2026-07-17T03:00:00.000Z"), "America/Los_Angeles");

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(6);
    expect(date.getDate()).toBe(16);
    expect(date.getHours()).toBe(20);
    expect(date.getMinutes()).toBe(0);
  });

  it("rejects wall-clock times that do not exist during a daylight-saving transition", () => {
    const date = zonedDateTimeToDate(
      { year: 2026, month: 3, day: 8, hour: 2, minute: 30, second: 0 },
      "America/Los_Angeles",
    );

    expect(date).toBeNull();
  });
});
