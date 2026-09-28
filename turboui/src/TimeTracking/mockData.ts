import { dateKey, shiftDate } from "./time";
import type { TimeDestination, TimeEntry } from "./types";

export const demoPerson = { id: "alex", fullName: "Alex Morgan", avatarUrl: null };
export const demoTeammate = { id: "sam", fullName: "Sam Rivera", avatarUrl: null };
export const demoProject: TimeDestination = {
  id: "project-launch",
  name: "General project work",
  kind: "project",
  scopeId: "launch",
  scopeName: "Website relaunch",
  enabled: true,
  canTrack: true,
};
export const demoTask: TimeDestination = {
  ...demoProject,
  id: "task-design",
  name: "Design the new homepage",
  kind: "task",
  milestone: { id: "design", name: "Design ready" },
};
export const demoBuildTask: TimeDestination = {
  ...demoProject,
  id: "task-build",
  name: "Build the landing page",
  kind: "task",
  milestone: { id: "build", name: "Ready to launch" },
};
export const demoSpaceTask: TimeDestination = {
  id: "task-research",
  name: "Review customer interviews",
  kind: "space-task",
  scopeId: "product",
  scopeName: "Product",
  enabled: true,
  canTrack: true,
};
export const demoDestinations = [demoProject, demoTask, demoBuildTask, demoSpaceTask];

export function createDemoEntries(today: string): TimeEntry[] {
  const entry = (
    id: string,
    destination: TimeDestination,
    day: number,
    durationSeconds: number,
    notes: string,
    person = demoPerson,
  ): TimeEntry => ({
    id,
    destination,
    date: shiftDate(today, day),
    timezone: "UTC",
    durationSeconds,
    notes,
    person,
    source: "manual",
    canEdit: true,
    canDelete: true,
  });
  return [
    entry("design-today", demoTask, 0, 5400, "Refined the mobile layout and navigation."),
    entry("planning", demoProject, 0, 2700, "Weekly project planning."),
    entry("build-today", demoBuildTask, 0, 7200, "Built the hero and customer stories sections.", demoTeammate),
    entry("research", demoSpaceTask, 0, 3600, "Summarized feedback from three interviews."),
    entry("design-yesterday", demoTask, -1, 7200, "Explored two homepage directions."),
    entry("design-review", demoTask, -1, 3600, "Design review and accessibility notes.", demoTeammate),
    entry("design-wireframes", demoTask, -8, 2700, "Sketched the first wireframes."),
    entry("design-research", demoTask, -9, 1800, "Reviewed customer feedback."),
    entry("project-kickoff", demoProject, -2, 1800, "Aligned on scope and launch milestones."),
    entry("last-week", demoBuildTask, -7, 10800, "Set up the page structure.", demoTeammate),
  ];
}

export function demoToday(timezone: string) {
  return dateKey(new Date(), timezone);
}
