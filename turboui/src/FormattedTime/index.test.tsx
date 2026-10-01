import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { FormattedTime } from "./index";
import { defaultFormattedTimePreferences } from "./types";
import * as BreakpointHooks from "../utils/useWindowSizeBreakpoint";

jest.mock("./useRenderInterval", () => ({
  useRenderInterval: () => Date.now(),
}));

jest.mock("../utils/useWindowSizeBreakpoint", () => ({
  __esModule: true,
  ...jest.requireActual("../utils/useWindowSizeBreakpoint"),
  useWindowSizeBiggerOrEqualTo: jest.fn(),
}));

const mockUseWindowSizeBiggerOrEqualTo = BreakpointHooks.useWindowSizeBiggerOrEqualTo as jest.Mock;

describe("FormattedTime", () => {
  const NOW = new Date("2024-01-01T12:00:00Z").getTime();

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.setSystemTime(NOW);
    mockUseWindowSizeBiggerOrEqualTo.mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders relative time labels without external i18n setup", () => {
    render(
      <FormattedTime {...defaultFormattedTimePreferences} time={new Date(NOW - 5 * 60 * 1000)} format="relative" />,
    );

    expect(screen.getByText("5 minutes ago")).toBeInTheDocument();
  });

  it.each([
    ["month", "en-US", "December 2023"],
    ["month", "pt-BR", "dezembro de 2023"],
    ["long-month-date", "en-US", "December 31, 2023"],
    ["long-month-date", "pt-BR", "31 de dezembro de 2023"],
  ] as const)("formats check-in %s in %s after applying the timezone", (format, locale, expected) => {
    render(
      <FormattedTime
        {...defaultFormattedTimePreferences}
        timezone="America/Sao_Paulo"
        locale={locale}
        time={new Date("2024-01-01T01:00:00Z")}
        format={format}
      />,
    );
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  describe.each(["month", "long-month-date"] as const)("%s at the year boundary", (format) => {
    it.each([
      ["2024-01-01T01:00:00Z", "America/Los_Angeles", "2023-12-15T12:00:00Z", "December", "December 15"],
      ["2024-01-01T01:00:00Z", "America/Los_Angeles", "2024-01-05T12:00:00Z", "January 2024", "January 5, 2024"],
      ["2023-12-31T12:00:00Z", "Pacific/Kiritimati", "2024-01-05T00:00:00Z", "January", "January 5"],
      ["2023-12-31T12:00:00Z", "Pacific/Kiritimati", "2023-12-30T12:00:00Z", "December 2023", "December 31, 2023"],
    ])("compares the date with now in %s / %s", (now, timezone, time, month, date) => {
      jest.setSystemTime(new Date(now));
      render(
        <FormattedTime
          {...defaultFormattedTimePreferences}
          locale="en-US"
          timezone={timezone}
          time={new Date(time)}
          format={format}
        />,
      );
      expect(screen.getByText(format === "month" ? month : date)).toBeInTheDocument();
    });
  });

  it.each(["relative", "relative-time-or-date"] as const)(
    "calculates %s from the original instant regardless of timezone",
    (format) => {
      render(
        <FormattedTime
          {...defaultFormattedTimePreferences}
          timezone="Pacific/Kiritimati"
          time={new Date(NOW - 5 * 60 * 1000)}
          format={format}
        />,
      );

      expect(screen.getByText("5 minutes ago")).toBeInTheDocument();
    },
  );
});
