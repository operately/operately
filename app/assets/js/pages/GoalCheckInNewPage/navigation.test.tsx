import { Goal } from "@/models/goals";
import { buildGoalCheckInNewNavigation } from "./navigation";

const paths = {
  spacePath: (id: string) => `/spaces/${id}`,
  spaceWorkMapPath: (id: string) => `/spaces/${id}/work-map`,
  workMapPath: (tab: string) => `/work-map/${tab}`,
  goalPath: (id: string, params?: { tab?: string }) => `/goals/${id}` + (params?.tab ? `?tab=${params.tab}` : ""),
} as any;

describe("buildGoalCheckInNewNavigation", () => {
  it("includes space breadcrumbs when the goal has a space", () => {
    const goal = {
      id: "goal-1",
      name: "Company Goal",
      space: { id: "space-1", name: "Operations" },
    } as Goal;

    expect(buildGoalCheckInNewNavigation(goal, paths)).toEqual([
      { to: "/spaces/space-1", label: "Operations" },
      { to: "/spaces/space-1/work-map", label: "Work Map" },
      { to: "/goals/goal-1", label: "Company Goal" },
      { to: "/goals/goal-1?tab=check-ins", label: "Check-ins" },
    ]);
  });

  it("falls back to company work map when the goal has no space", () => {
    const goal = {
      id: "goal-1",
      name: "Company Goal",
    } as Goal;

    const items = buildGoalCheckInNewNavigation(goal, paths);

    expect(items).toEqual([
      { to: "/work-map/goals", label: "Work Map" },
      { to: "/goals/goal-1", label: "Company Goal" },
      { to: "/goals/goal-1?tab=check-ins", label: "Check-ins" },
    ]);
    expect(items.some((item) => item.label === "Operations")).toBe(false);
  });
});
