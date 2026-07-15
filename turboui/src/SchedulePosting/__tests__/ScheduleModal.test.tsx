import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { ScheduleModal } from "../ScheduleModal";
import { ScheduleNotice } from "../ScheduleNotice";
import { defaultFormattedTimePreferences } from "../../utils/storybook/formattedTime";

const utcPreferences = { ...defaultFormattedTimePreferences, timezone: "UTC", timeFormat: "hour_24" as const };
const losAngelesPreferences = {
  ...defaultFormattedTimePreferences,
  timezone: "America/Los_Angeles",
  timeFormat: "hour_24" as const,
};

function renderScheduleModal(props: Partial<React.ComponentProps<typeof ScheduleModal>> = {}) {
  return render(
    <ScheduleModal
      open={true}
      onOpenChange={jest.fn()}
      onSchedule={jest.fn()}
      onCancel={jest.fn()}
      scheduledAt={null}
      formattedTimePreferences={utcPreferences}
      title="Schedule Discussion"
      {...props}
    />,
  );
}

describe("ScheduleModal", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-07-14T07:50:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows the provided title", () => {
    renderScheduleModal({ title: "Schedule Check-in" });

    expect(screen.getByRole("heading", { name: "Schedule Check-in" })).toBeInTheDocument();
  });

  it("allows selecting today while requiring a future time", async () => {
    const onSchedule = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    renderScheduleModal({ onSchedule, formattedTimePreferences: utcPreferences });

    const today = document.querySelector<HTMLButtonElement>('[data-test-id="date-field-day-14"]');
    if (!today) throw new Error("Today's date button was not rendered");
    expect(today).toBeEnabled();

    await user.click(today);
    const timePicker = screen.getByRole("button", { name: "Time" });
    await user.click(timePicker);
    const hourOptions = screen.getByRole("group", { name: "Hour" });
    const minuteOptions = screen.getByRole("group", { name: "Minute" });
    await user.click(within(hourOptions).getByRole("button", { name: "07", pressed: false }));
    await user.click(within(minuteOptions).getByRole("button", { name: "49", pressed: false }));

    expect(screen.getByRole("button", { name: "Schedule" })).toBeDisabled();
    expect(screen.getByText("Time must be in the future")).toBeInTheDocument();

    await user.click(within(hourOptions).getByRole("button", { name: "08", pressed: false }));
    await user.click(within(minuteOptions).getByRole("button", { name: "00", pressed: false }));
    await user.click(timePicker);

    expect(screen.getByRole("button", { name: "Schedule" })).toBeEnabled();
    expect(screen.queryByText("Time must be in the future")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Schedule" }));

    expect(onSchedule).toHaveBeenCalledWith(new Date("2026-07-14T08:00:00.000Z"));
  });

  it("schedules and displays the selected wall-clock time in the user's timezone", async () => {
    jest.setSystemTime(new Date("2026-07-14T12:00:00.000Z"));
    const onSchedule = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    const { unmount } = renderScheduleModal({
      onSchedule,
      formattedTimePreferences: losAngelesPreferences,
    });

    const selectedDay = document.querySelector<HTMLButtonElement>('[data-test-id="date-field-day-16"]');
    if (!selectedDay) throw new Error("The selected date button was not rendered");
    await user.click(selectedDay);
    await user.click(screen.getByRole("button", { name: "Time" }));
    await user.click(
      within(screen.getByRole("group", { name: "Hour" })).getByRole("button", { name: "20", pressed: false }),
    );
    await user.click(screen.getByRole("button", { name: "Schedule" }));

    const scheduledDate = onSchedule.mock.calls[0][0];
    expect(scheduledDate).toEqual(new Date("2026-07-17T03:00:00.000Z"));

    unmount();
    render(<ScheduleNotice date={scheduledDate} onEdit={jest.fn()} formattedTimePreferences={losAngelesPreferences} />);

    expect(screen.getByText(/Will be posted on July 16th at 20:00/)).toBeInTheDocument();
  });

  it("rejects a wall-clock time that does not exist in the user's timezone", async () => {
    jest.setSystemTime(new Date("2026-03-07T12:00:00.000Z"));
    const onSchedule = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    renderScheduleModal({ onSchedule, formattedTimePreferences: losAngelesPreferences });

    const daylightSavingDay = document.querySelector<HTMLButtonElement>('[data-test-id="date-field-day-8"]');
    if (!daylightSavingDay) throw new Error("The daylight-saving date button was not rendered");
    await user.click(daylightSavingDay);
    await user.click(screen.getByRole("button", { name: "Time" }));

    const hourOptions = screen.getByRole("group", { name: "Hour" });
    const minuteOptions = screen.getByRole("group", { name: "Minute" });
    await user.click(within(hourOptions).getByRole("button", { name: "02", pressed: false }));
    await user.click(within(minuteOptions).getByRole("button", { name: "30", pressed: false }));

    const scheduleButton = screen.getByRole("button", { name: "Schedule" });
    expect(scheduleButton).toBeDisabled();
    expect(screen.getByText("This time does not exist in your timezone")).toBeInTheDocument();

    await user.click(scheduleButton);
    expect(onSchedule).not.toHaveBeenCalled();
  });

  it("closes the time picker on outside click while keeping the selected time and modal open", async () => {
    const onOpenChange = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    renderScheduleModal({ onOpenChange, title: "Schedule Check-in" });

    await user.click(screen.getByRole("button", { name: "Time" }));
    await user.click(
      within(screen.getByRole("group", { name: "Hour" })).getByRole("button", { name: "14", pressed: false }),
    );

    expect(screen.getByText("Select time")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Time" })).toHaveTextContent("14:00");

    const tomorrow = document.querySelector<HTMLButtonElement>('[data-test-id="date-field-day-15"]');
    if (!tomorrow) throw new Error("Tomorrow's date button was not rendered");
    await user.click(tomorrow);

    expect(screen.queryByText("Select time")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Time" })).toHaveTextContent("14:00");
    expect(screen.getByRole("heading", { name: "Schedule Check-in" })).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it("preselects an existing schedule when the modal opens for the first time", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    renderScheduleModal({
      scheduledAt: new Date("2026-08-17T03:00:00.000Z"),
      formattedTimePreferences: losAngelesPreferences,
    });

    expect(screen.getByTestId("date-field-current-month")).toHaveTextContent("August 2026");
    expect(document.querySelector('[data-test-id="date-field-day-16"]')).toHaveAttribute("aria-pressed", "true");

    const timePicker = screen.getByRole("button", { name: "Time" });
    expect(timePicker).toHaveTextContent("20:00");
    await user.click(timePicker);

    expect(
      within(screen.getByRole("group", { name: "Hour" })).getByRole("button", { name: "20", pressed: true }),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("group", { name: "Minute" })).getByRole("button", { name: "00", pressed: true }),
    ).toBeInTheDocument();
  });
});
