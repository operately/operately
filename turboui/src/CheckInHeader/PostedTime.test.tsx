import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { defaultFormattedTimePreferences } from "../FormattedTime";
import { PostedTime } from "./PostedTime";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, "ResizeObserver", {
  configurable: true,
  value: ResizeObserverMock,
});

describe("PostedTime", () => {
  const publishedAt = "2025-07-13T18:42:00Z";

  it("shows only the localized posting time visually", () => {
    render(
      <PostedTime
        time={publishedAt}
        formattedTimePreferences={{
          ...defaultFormattedTimePreferences,
          timezone: "America/Sao_Paulo",
          timeFormat: "hour_12",
        }}
      />,
    );

    const visibleTime = screen.getByText("3:42pm");

    expect(visibleTime).toHaveAttribute("aria-hidden", "true");
  });

  it("provides the full localized posting timestamp to screen readers", () => {
    render(
      <PostedTime
        time={publishedAt}
        formattedTimePreferences={{
          ...defaultFormattedTimePreferences,
          timezone: "America/Sao_Paulo",
          timeFormat: "hour_24",
        }}
      />,
    );

    expect(screen.getByText("Posted July 13th, 2025 at 15:42")).toHaveClass("sr-only");
  });

  it("shows the full localized posting timestamp on hover", async () => {
    render(
      <PostedTime
        time={publishedAt}
        formattedTimePreferences={{
          ...defaultFormattedTimePreferences,
          timezone: "America/Sao_Paulo",
          timeFormat: "hour_24",
        }}
      />,
    );

    fireEvent.pointerMove(screen.getByText("15:42"), { pointerType: "mouse" });

    expect(await screen.findByRole("tooltip")).toHaveTextContent("Posted July 13th, 2025 at 15:42");
  });
});
