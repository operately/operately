import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";

import { TimePicker } from ".";

const hour12Preferences = { locale: "en-US", timeFormat: "hour_12" as const };
const hour24Preferences = { locale: "en-US", timeFormat: "hour_24" as const };

describe("TimePicker", () => {
  it("presents the selected time using the user's 12-hour preference", () => {
    render(
      <>
        <label id="time-label">Time</label>
        <TimePicker
          value={new Date(2026, 6, 14, 19, 5)}
          onChange={jest.fn()}
          ariaLabelledBy="time-label"
          formattedTimePreferences={hour12Preferences}
        />
      </>,
    );

    const trigger = screen.getByRole("button", { name: "Time" });

    expect(trigger).toHaveTextContent("7:05pm");
    expect(trigger).toHaveClass("cursor-pointer");
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
  });

  it("presents the selected time using the user's 24-hour preference", () => {
    render(
      <TimePicker
        value={new Date(2026, 6, 14, 19, 5)}
        onChange={jest.fn()}
        formattedTimePreferences={hour24Preferences}
      />,
    );

    expect(screen.getByRole("button", { name: "19:05" })).toBeInTheDocument();
  });

  it("uses exact 24-hour and minute controls", async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();

    render(
      <TimePicker
        value={new Date(2026, 6, 14, 9, 0)}
        onChange={onChange}
        formattedTimePreferences={hour12Preferences}
      />,
    );

    await user.click(screen.getByRole("button", { name: "9:00am" }));

    expect(screen.getByText("Select time")).toBeInTheDocument();
    const hourOptions = screen.getByRole("group", { name: "Hour" });
    const minuteOptions = screen.getByRole("group", { name: "Minute" });
    expect(within(hourOptions).getByRole("button", { name: "00" })).toBeInTheDocument();
    expect(within(hourOptions).getByRole("button", { name: "23" })).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: "Period" })).not.toBeInTheDocument();

    await user.click(within(hourOptions).getByRole("button", { name: "23", pressed: false }));
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 6, 14, 23, 0));

    await user.click(within(minuteOptions).getByRole("button", { name: "37", pressed: false }));
    expect(onChange).toHaveBeenLastCalledWith(new Date(2026, 6, 14, 9, 37));
  });

  it("does not open when disabled", async () => {
    const user = userEvent.setup();

    render(
      <TimePicker
        value={new Date(2026, 6, 14, 9, 0)}
        onChange={jest.fn()}
        formattedTimePreferences={hour12Preferences}
        disabled
      />,
    );

    const trigger = screen.getByRole("button", { name: "9:00am" });
    expect(trigger).toBeDisabled();

    await user.click(trigger);
    expect(screen.queryByText("Select time")).not.toBeInTheDocument();
  });
});
