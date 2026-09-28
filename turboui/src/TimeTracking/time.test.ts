import { parseDuration, durationInput, dateKey, clockInterval } from "./time";

describe("time entry durations", () => {
  it.each([
    ["45m", 2700],
    ["1h 30m", 5400],
    ["1.5h", 5400],
    ["1:30", 5400],
    ["90", 5400],
    ["5s", 5],
  ])("parses %s without losing precision", (input, seconds) => expect(parseDuration(input)).toBe(seconds));
  it.each(["", "0", "-2h", "1:75", "2 hours maybe", "1h 2h", "Infinity", "1.2.3h"])(
    "rejects invalid duration %s",
    (input) => expect(parseDuration(input)).toBeNull(),
  );
  it("round-trips an entry with seconds", () => expect(parseDuration(durationInput(5467))).toBe(5467));
});

describe("entry dates", () => {
  it("uses the reporting timezone for today", () => {
    expect(dateKey(new Date("2026-09-25T01:00:00Z"), "America/Sao_Paulo")).toBe("2026-09-24");
  });
  it("handles overnight wall-clock intervals and rejects nonexistent DST times", () => {
    expect(
      clockInterval({ date: "2026-09-24", endDate: "2026-09-25", start: "23:30", end: "00:30", timezone: "UTC" })
        ?.durationSeconds,
    ).toBe(3600);
    expect(
      clockInterval({
        date: "2026-03-08",
        endDate: "2026-03-08",
        start: "02:30",
        end: "03:30",
        timezone: "America/New_York",
      }),
    ).toBeNull();
  });
});
