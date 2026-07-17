import React from "react";
import { act, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import "../i18n";
import * as BreakpointHooks from "../utils/useWindowSizeBreakpoint";
import RelativeTime from "./RelativeTime";

jest.mock("../utils/useWindowSizeBreakpoint", () => ({
  __esModule: true,
  ...jest.requireActual("../utils/useWindowSizeBreakpoint"),
  useWindowSizeBiggerOrEqualTo: jest.fn(),
}));

const mockUseWindowSizeBiggerOrEqualTo = BreakpointHooks.useWindowSizeBiggerOrEqualTo as jest.Mock;

describe("RelativeTime updates", () => {
  const NOW = new Date("2024-01-01T12:00:00Z").getTime();

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
    mockUseWindowSizeBiggerOrEqualTo.mockReturnValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it("refreshes the label as time passes without receiving new props", () => {
    render(<RelativeTime locale="en-US" time={new Date(NOW)} />);

    expect(screen.getByText("just now")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(75 * 1000);
    });

    expect(screen.getByText("1 minute ago")).toBeInTheDocument();
  });
});
