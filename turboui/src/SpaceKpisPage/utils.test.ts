import { fromIsoDate, toIsoDate } from "./utils";

describe("fromIsoDate", () => {
  // `new Date("2026-01-01")` is UTC midnight, which is the previous calendar
  // day west of UTC. The stored period is a calendar date, not an instant.
  test("parses YYYY-MM-DD as a local calendar day", () => {
    const date = fromIsoDate("2026-01-01");

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(1);
  });

  test("round-trips with toIsoDate", () => {
    expect(toIsoDate(fromIsoDate("2024-03-01"))).toBe("2024-03-01");
  });
});
