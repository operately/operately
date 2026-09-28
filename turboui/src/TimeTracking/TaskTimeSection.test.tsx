import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TaskTimeSection } from "./TaskTimeSection";
import { createDemoEntries, demoDestinations, demoPerson, demoTask } from "./mockData";
import { defaultFormattedTimePreferences } from "../FormattedTime";
import type { TaskTimeSectionProps } from "./types";

function taskProps(): TaskTimeSectionProps {
  const success = jest.fn().mockResolvedValue({ ok: true });
  return {
    destination: demoTask,
    // Intentionally unsorted: the component chooses the most recent work dates.
    entries: createDemoEntries("2026-09-28").reverse(),
    destinations: demoDestinations,
    today: "2026-09-28",
    currentPersonId: demoPerson.id,
    activeTimer: null,
    canViewTeam: true,
    formattedTimePreferences: defaultFormattedTimePreferences,
    onSaveEntry: success,
    onDeleteEntry: success,
    onStartTimer: success,
    onStopTimer: success,
    onSwitchTimer: success,
    onDiscardTimer: success,
  };
}

it("shows the latest three entries and preserves totals when older entries are expanded and collapsed", () => {
  const { container } = render(<TaskTimeSection {...taskProps()} />);
  const visibleIds = () =>
    Array.from(container.querySelectorAll('[data-test-id="time-entry-list"] > div')).map((row) =>
      row.getAttribute("data-test-id"),
    );
  expect(visibleIds()).toEqual(["time-entry-design-today", "time-entry-design-review", "time-entry-design-yesterday"]);
  const total = container.querySelector('[data-test-id="task-team-time"]');
  expect(total).toHaveTextContent("5h 45m");
  const toggle = container.querySelector<HTMLElement>('[data-test-id="toggle-older-time-entries"]');
  if (!toggle) throw new Error("Missing older entries toggle");
  fireEvent.click(toggle);
  expect(visibleIds()).toHaveLength(5);
  expect(toggle).toHaveAttribute("aria-expanded", "true");
  expect(total).toHaveTextContent("5h 45m");
  fireEvent.click(toggle);
  expect(visibleIds()).toHaveLength(3);
  expect(toggle).toHaveAttribute("aria-expanded", "false");
});

it("does not offer expansion for three or fewer authorized entries", () => {
  const props = taskProps();
  const entries = props.entries.filter((entry) =>
    ["design-today", "design-review", "design-yesterday"].includes(entry.id),
  );
  const { container } = render(<TaskTimeSection {...props} entries={entries} canViewTeam={false} />);
  expect(container.querySelectorAll('[data-test-id="time-entry-list"] > div')).toHaveLength(2);
  expect(container.querySelector('[data-test-id="time-entry-design-review"]')).toBeNull();
  expect(container.querySelector('[data-test-id="toggle-older-time-entries"]')).toBeNull();
});

it("offers to stop an active timer on a completed task", async () => {
  const props = taskProps();
  render(
    <TaskTimeSection
      {...props}
      isTaskClosed
      activeTimer={{ id: "timer", destination: demoTask, startedAt: new Date().toISOString() }}
    />,
  );
  expect(screen.queryByRole("button", { name: "Start timer" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Stop timer" }));
  await waitFor(() => expect(props.onStopTimer).toHaveBeenCalledWith("timer"));
});
