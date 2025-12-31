import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import RelativeTime from "./RelativeTime";
import * as BreakpointHooks from "../utils/useWindowSizeBreakpoint";

// Mock useRenderInterval to avoid unnecessary re-renders/timers
jest.mock("./useRenderInterval", () => ({
  useRenderInterval: () => 0,
}));

// Mock useWindowSizeBiggerOrEqualTo to control responsive behavior
jest.mock("../utils/useWindowSizeBreakpoint", () => ({
  __esModule: true, // Use actual implementation for other exports if any
  ...jest.requireActual("../utils/useWindowSizeBreakpoint"),
  useWindowSizeBiggerOrEqualTo: jest.fn(),
}));

// Get the mocked function with correct typing
const mockUseWindowSizeBiggerOrEqualTo = BreakpointHooks.useWindowSizeBiggerOrEqualTo as jest.Mock;

describe("RelativeTime", () => {
  // Fixed "Now" for consistent testing
  const NOW = new Date("2024-01-01T12:00:00Z").getTime();

  beforeAll(() => {
    // Freeze system time
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    // Default to large screen
    mockUseWindowSizeBiggerOrEqualTo.mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createDate = (diffMs: number) => new Date(NOW - diffMs);

  describe("Seconds", () => {
    it("renders 'just now' for < 10 seconds", () => {
      render(<RelativeTime time={createDate(5 * 1000)} />);
      expect(screen.getByText("just now")).toBeInTheDocument();
    });

    it("renders 'just now' for 9 seconds", () => {
      render(<RelativeTime time={createDate(9 * 1000)} />);
      expect(screen.getByText("just now")).toBeInTheDocument();
    });

    it("renders 'seconds ago' for 10 to 59 seconds", () => {
      render(<RelativeTime time={createDate(10 * 1000)} />);
      expect(screen.getByText("10 seconds ago")).toBeInTheDocument();

      render(<RelativeTime time={createDate(59 * 1000)} />);
      expect(screen.getByText("59 seconds ago")).toBeInTheDocument();
    });
  });

  describe("Minutes", () => {
    describe("On Large Screens", () => {
      beforeEach(() => {
        mockUseWindowSizeBiggerOrEqualTo.mockReturnValue(true);
      });

      it("renders '1 minute ago' for singular minute", () => {
        render(<RelativeTime time={createDate(60 * 1000)} />);
        expect(screen.getByText("1 minute ago")).toBeInTheDocument();
      });

      it("renders 'X minutes ago' for plural minutes", () => {
        render(<RelativeTime time={createDate(5 * 60 * 1000)} />);
        expect(screen.getByText("5 minutes ago")).toBeInTheDocument();

        render(<RelativeTime time={createDate(59 * 60 * 1000)} />);
        expect(screen.getByText("59 minutes ago")).toBeInTheDocument();
      });
    });

    describe("On Small Screens", () => {
      beforeEach(() => {
        mockUseWindowSizeBiggerOrEqualTo.mockReturnValue(false);
      });

      it("renders 'min. ago' for minutes", () => {
        render(<RelativeTime time={createDate(5 * 60 * 1000)} />);
        expect(screen.getByText("5 min. ago")).toBeInTheDocument();
      });
    });
  });

  describe("Hours", () => {
    it("renders '1 hour ago'", () => {
      render(<RelativeTime time={createDate(60 * 60 * 1000)} />);
      expect(screen.getByText("1 hour ago")).toBeInTheDocument();
    });

    it("renders 'X hours ago'", () => {
      render(<RelativeTime time={createDate(5 * 60 * 60 * 1000)} />);
      expect(screen.getByText("5 hours ago")).toBeInTheDocument();

      render(<RelativeTime time={createDate(23 * 60 * 60 * 1000)} />);
      expect(screen.getByText("23 hours ago")).toBeInTheDocument();
    });
  });

  describe("Days", () => {
    it("renders '1 day ago'", () => {
      render(<RelativeTime time={createDate(24 * 60 * 60 * 1000)} />);
      expect(screen.getByText("1 day ago")).toBeInTheDocument();
    });

    it("renders 'X days ago' for < 7 days", () => {
      render(<RelativeTime time={createDate(6 * 24 * 60 * 60 * 1000)} />);
      expect(screen.getByText("6 days ago")).toBeInTheDocument();
    });
  });

  describe("Weeks", () => {
    it("renders '1 week ago'", () => {
      render(<RelativeTime time={createDate(7 * 24 * 60 * 60 * 1000)} />);
      expect(screen.getByText("1 week ago")).toBeInTheDocument();
    });

    it("renders 'X weeks ago' for standard weeks", () => {
      render(<RelativeTime time={createDate(3 * 7 * 24 * 60 * 60 * 1000)} />);
      expect(screen.getByText("3 weeks ago")).toBeInTheDocument();
    });

    it("renders '4 weeks ago' for exactly 4 weeks (28 days)", () => {
      // 28 days
      render(<RelativeTime time={createDate(28 * 24 * 60 * 60 * 1000)} />);
      expect(screen.getByText("4 weeks ago")).toBeInTheDocument();
    });

    it("renders '4 weeks ago' for 29 days (The Logic Gap Fix)", () => {
      // 29 days is the edge case where:
      // weeks = floor(29/7) = 4
      // months = floor(29/30) = 0
      // Previous logic (weeks < 4) would skip weeks block and show "0 months ago"
      // New logic (days < 30) should show "4 weeks ago"
      render(<RelativeTime time={createDate(29 * 24 * 60 * 60 * 1000)} />);
      expect(screen.getByText("4 weeks ago")).toBeInTheDocument();
    });
  });

  describe("Months", () => {
    it("renders '1 month ago' for exactly 30 days", () => {
      render(<RelativeTime time={createDate(30 * 24 * 60 * 60 * 1000)} />);
      expect(screen.getByText("1 month ago")).toBeInTheDocument();
    });

    it("renders 'X months ago'", () => {
      render(<RelativeTime time={createDate(65 * 24 * 60 * 60 * 1000)} />);
      expect(screen.getByText("2 months ago")).toBeInTheDocument();
    });

    it("renders '11 months ago' correctly", () => {
      // 11 months * 30 = 330 days
      render(<RelativeTime time={createDate(330 * 24 * 60 * 60 * 1000)} />);
      expect(screen.getByText("11 months ago")).toBeInTheDocument();
    });
  });

  describe("Years", () => {
    it("renders '1 year ago' for exactly 365 days", () => {
      render(<RelativeTime time={createDate(365 * 24 * 60 * 60 * 1000)} />);
      expect(screen.getByText("1 year ago")).toBeInTheDocument();
    });

    it("renders 'X years ago'", () => {
      render(<RelativeTime time={createDate(750 * 24 * 60 * 60 * 1000)} />);
      expect(screen.getByText("2 years ago")).toBeInTheDocument();
    });
  });
});
