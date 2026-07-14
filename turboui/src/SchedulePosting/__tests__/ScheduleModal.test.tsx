import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ScheduleModal } from "../ScheduleModal";

describe("ScheduleModal", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 6, 14, 7, 50));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("allows selecting today while requiring a future time", async () => {
    const onSchedule = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<ScheduleModal open={true} onOpenChange={jest.fn()} onSchedule={onSchedule} onCancel={jest.fn()} />);

    const today = screen.getByTestId("date-field-day-14");
    expect(today).toBeEnabled();

    await user.click(today);
    const timeInput = screen.getByDisplayValue("09:00");
    await user.clear(timeInput);
    await user.type(timeInput, "07:49");

    expect(screen.getByRole("button", { name: "Schedule" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("Time must be in the future");

    await user.clear(timeInput);
    await user.type(timeInput, "08:00");

    expect(screen.getByRole("button", { name: "Schedule" })).toBeEnabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Schedule" }));

    expect(onSchedule).toHaveBeenCalledWith(new Date(2026, 6, 14, 8, 0));
  });
});
