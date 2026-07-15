import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { InlineCalendar } from "./InlineCalendar";

const JULY_14_2026 = new Date(2026, 6, 14);

function renderCalendar(overrides: Partial<React.ComponentProps<typeof InlineCalendar>> = {}) {
  const setSelectedDate = jest.fn();

  const view = render(
    <InlineCalendar selectedDate={null} setSelectedDate={setSelectedDate} today={JULY_14_2026} {...overrides} />,
  );

  return { setSelectedDate, ...view };
}

function getDay(day: number): HTMLButtonElement {
  return screen.getByRole("button", { name: day.toString() });
}

function queryDay(day: number): HTMLButtonElement | null {
  return screen.queryByRole("button", { name: day.toString() });
}

describe("InlineCalendar", () => {
  it("renders the supplied current month and highlights today", () => {
    renderCalendar();

    expect(screen.getByTestId("date-field-current-month")).toHaveTextContent("July 2026");

    const today = getDay(14);
    expect(today).toHaveAttribute("data-date", "2026-07-14");
    expect(today).toHaveAttribute("aria-pressed", "false");
    expect(today).toHaveClass("border-blue-300");
    expect(today).toBeEnabled();
  });

  it("opens on the selected date's month and marks its day as selected", () => {
    renderCalendar({
      selectedDate: {
        date: new Date(2026, 7, 16),
        dateType: "day",
        value: "Aug 16, 2026",
      },
    });

    expect(screen.getByTestId("date-field-current-month")).toHaveTextContent("August 2026");

    const selectedDay = getDay(16);
    expect(selectedDay).toHaveAttribute("data-date", "2026-08-16");
    expect(selectedDay).toHaveAttribute("aria-pressed", "true");
    expect(selectedDay).toHaveClass("border-blue-500", "bg-blue-50", "text-blue-700");
  });

  it("navigates between months across year boundaries", async () => {
    const user = userEvent.setup();
    renderCalendar({ today: new Date(2026, 0, 15) });

    await user.click(screen.getByTestId("date-field-prev-month"));
    expect(screen.getByTestId("date-field-current-month")).toHaveTextContent("December 2025");

    await user.click(screen.getByTestId("date-field-next-month"));
    expect(screen.getByTestId("date-field-current-month")).toHaveTextContent("January 2026");

    await user.click(screen.getByTestId("date-field-next-month"));
    expect(screen.getByTestId("date-field-current-month")).toHaveTextContent("February 2026");
  });

  it("preserves every navigation step when several month changes are batched", () => {
    renderCalendar({
      selectedDate: {
        date: new Date(2024, 1, 11),
        dateType: "day",
        value: "Feb 11, 2024",
      },
    });

    expect(screen.getByTestId("date-field-current-month")).toHaveTextContent("February 2024");

    const nextMonth = screen.getByTestId("date-field-next-month");
    act(() => {
      for (let month = 0; month < 29; month++) {
        nextMonth.click();
      }
    });

    expect(screen.getByTestId("date-field-current-month")).toHaveTextContent("July 2026");
    expect(getDay(14)).toHaveAttribute("data-date", "2026-07-14");
  });

  it("returns the selected day as a contextual date", async () => {
    const user = userEvent.setup();
    const { setSelectedDate } = renderCalendar();

    await user.click(getDay(15));

    expect(setSelectedDate).toHaveBeenCalledTimes(1);
    expect(setSelectedDate).toHaveBeenCalledWith({
      date: new Date(2026, 6, 15),
      dateType: "day",
      value: "Jul 15, 2026",
    });
  });

  it("disables dates outside the inclusive minimum and maximum range", async () => {
    const user = userEvent.setup();
    const { setSelectedDate } = renderCalendar({
      minDateLimit: new Date(2026, 6, 10),
      maxDateLimit: new Date(2026, 6, 20),
    });

    expect(getDay(9)).toBeDisabled();
    expect(getDay(10)).toBeEnabled();
    expect(getDay(20)).toBeEnabled();
    expect(getDay(21)).toBeDisabled();

    await user.click(getDay(9));
    await user.click(getDay(21));
    expect(setSelectedDate).not.toHaveBeenCalled();
  });

  it("renders leap day only in leap years", () => {
    const { unmount } = renderCalendar({ today: new Date(2024, 1, 1) });

    expect(getDay(29)).toHaveAttribute("data-date", "2024-02-29");
    expect(queryDay(30)).not.toBeInTheDocument();

    unmount();
    renderCalendar({ today: new Date(2025, 1, 1) });

    expect(screen.getByTestId("date-field-current-month")).toHaveTextContent("February 2025");
    expect(queryDay(29)).not.toBeInTheDocument();
  });
});
