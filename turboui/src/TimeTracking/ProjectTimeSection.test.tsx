import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ProjectTimeSection } from "./ProjectTimeSection";
import { createDemoEntries, demoDestinations, demoPerson, demoProject } from "./mockData";
import { defaultFormattedTimePreferences } from "../FormattedTime";
import type { ProjectTimeSectionProps } from "./types";

function projectProps(overrides: Partial<ProjectTimeSectionProps> = {}): ProjectTimeSectionProps {
  const success = jest.fn().mockResolvedValue({ ok: true });
  return {
    projectDestination: demoProject,
    entries: createDemoEntries("2026-09-28"),
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
    ...overrides,
  };
}

it("totals the full project history and initially shows only the latest three entries", () => {
  const { container } = render(<ProjectTimeSection {...projectProps()} />);
  expect(container.querySelector('[data-test-id="project-time-total"]')).toHaveTextContent("12h");
  const rows = () => container.querySelectorAll('[data-test-id="time-entry-list"] > div');
  expect(rows()).toHaveLength(3);
  expect(rows()[0]).toHaveAttribute("data-test-id", "time-entry-design-today");
  expect(container.querySelector('[data-test-id="time-entry-research"]')).toBeNull();
  const toggle = container.querySelector<HTMLElement>('[data-test-id="toggle-older-project-time-entries"]');
  if (!toggle) throw new Error("Missing history toggle");
  fireEvent.click(toggle);
  expect(rows()).toHaveLength(9);
  expect(container.querySelector('[data-test-id="project-time-total"]')).toHaveTextContent("12h");
  fireEvent.click(toggle);
  expect(rows()).toHaveLength(3);
});

it("only includes the viewer's entries when team access is unavailable", () => {
  const { container } = render(<ProjectTimeSection {...projectProps({ canViewTeam: false })} />);
  expect(container.querySelector('[data-test-id="project-time-total"]')).toHaveTextContent("6h");
  expect(screen.queryByText("Sam Rivera")).not.toBeInTheDocument();
});

it("opens manual logging for general project work", () => {
  const { container } = render(<ProjectTimeSection {...projectProps()} />);
  expect(container.querySelector('[data-test-id="start-timer"]')).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Log time" }));
  expect(screen.getByRole("dialog")).toBeVisible();
  expect(screen.getByLabelText("Duration")).toBeVisible();
});

it("keeps history visible when tracking is disabled", () => {
  const { container } = render(
    <ProjectTimeSection {...projectProps({ projectDestination: { ...demoProject, enabled: false } })} />,
  );
  expect(container.querySelector('[data-test-id="log-time"]')).toBeNull();
  expect(container.querySelector('[data-test-id="time-entry-list"]')).toBeVisible();
});

it.each([{ loading: true }, { error: "Unavailable" }])("does not show stale totals or entries during %j", (state) => {
  const { container } = render(<ProjectTimeSection {...projectProps(state)} />);
  expect(container.querySelector('[data-test-id="project-time-total"]')).toBeNull();
  expect(container.querySelector('[data-test-id="time-entry-list"]')).toBeNull();
});
