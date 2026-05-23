import { formatNumber, formatTime } from "@/utils/formatting";

describe("formatNumber", () => {
  test("uses locale-specific separators", () => {
    expect(formatNumber(1000.5, "de-DE", { minimumFractionDigits: 2 })).toEqual("1.000,50");
    expect(formatNumber(1000.5, "en-US", { minimumFractionDigits: 2 })).toEqual("1,000.50");
  });
});

describe("formatTime", () => {
  const time = new Date("2026-05-23T14:30:00");

  test("supports explicit 24-hour format", () => {
    expect(formatTime(time, "en-US", "hour_24")).toEqual("14:30");
  });

  test("supports explicit 12-hour format", () => {
    expect(formatTime(time, "en-US", "hour_12")).toEqual("2:30pm");
  });
});
