import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { GlobalTimeTracker, TimeTrackingControls } from "./TimerControls";
import { demoDestinations, demoTask, demoProject } from "./mockData";
import { defaultFormattedTimePreferences } from "../FormattedTime";
import type { TimeTrackingData } from "./types";

function timerData(): TimeTrackingData {
  const success = () => Promise.resolve({ ok: true as const });
  return {
    entries: [],
    destinations: demoDestinations,
    currentPersonId: "alex",
    today: "2026-09-25",
    formattedTimePreferences: defaultFormattedTimePreferences,
    activeTimer: { id: "timer", destination: demoTask, startedAt: new Date(Date.now() - 120000).toISOString() },
    onSaveEntry: success,
    onDeleteEntry: success,
    onStartTimer: jest.fn(success),
    onSwitchTimer: jest.fn(success),
    onStopTimer: jest.fn(success),
    onDiscardTimer: success,
  };
}

it("sends one stop request while saving", async () => {
  const data = timerData();
  let finish: () => void = () => undefined;
  data.onStopTimer = jest.fn(
    () =>
      new Promise((resolve) => {
        finish = () => resolve({ ok: true });
      }),
  );
  render(<GlobalTimeTracker data={data} />);
  fireEvent.click(screen.getByRole("button", { name: "Stop" }));
  fireEvent.click(screen.getByRole("button", { name: "Stop" }));
  expect(data.onStopTimer).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Stop" })).toBeDisabled();
  finish();
  await waitFor(() => expect(screen.getByRole("button", { name: "Stop" })).toBeEnabled());
});

it("stops a long session directly without opening a review form", async () => {
  const data = timerData();
  data.activeTimer = {
    id: "timer",
    destination: demoTask,
    startedAt: new Date(Date.now() - 9 * 3600000).toISOString(),
  };
  render(<GlobalTimeTracker data={data} />);
  fireEvent.click(screen.getByRole("button", { name: "Stop" }));
  await waitFor(() => expect(data.onStopTimer).toHaveBeenCalledWith("timer"));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

it("switches through one callback instead of independently stopping and starting", async () => {
  const data = timerData();
  render(<TimeTrackingControls data={data} destination={demoProject} />);
  fireEvent.click(screen.getByRole("button", { name: "Switch timer" }));
  fireEvent.click(screen.getByRole("button", { name: "Save and switch" }));
  await waitFor(() => expect(data.onSwitchTimer).toHaveBeenCalledWith("timer", demoProject.id));
  expect(data.onStopTimer).not.toHaveBeenCalled();
  expect(data.onStartTimer).not.toHaveBeenCalled();
});

it("keeps stop available after tracking is disabled", async () => {
  const data = timerData();
  data.destinations = [];
  render(<GlobalTimeTracker data={data} />);
  fireEvent.click(screen.getByRole("button", { name: "Stop" }));
  await waitFor(() => expect(data.onStopTimer).toHaveBeenCalledWith("timer"));
});
