import { ProjectCheckIn } from "@/models/projectCheckIns";
import { buildProjectCheckInEditNavigation } from "./navigation";

const paths = {
  spacePath: (id: string) => `/spaces/${id}`,
  spaceWorkMapPath: (id: string) => `/spaces/${id}/work-map/projects`,
  workMapPath: (tab: string) => `/work-map/${tab}`,
  projectPath: (id: string) => `/projects/${id}`,
  projectCheckInsPath: (id: string) => `/projects/${id}?tab=check-ins`,
} as any;

describe("buildProjectCheckInEditNavigation", () => {
  it("includes space breadcrumbs when the check-in has a space", () => {
    const checkIn = {
      id: "check-in-1",
      space: { id: "space-1", name: "Operations" },
      project: { id: "project-1", name: "Apollo" },
    } as ProjectCheckIn;

    expect(buildProjectCheckInEditNavigation(checkIn, paths)).toEqual([
      { to: "/spaces/space-1", label: "Operations" },
      { to: "/spaces/space-1/work-map/projects", label: "Work Map" },
      { to: "/projects/project-1", label: "Apollo" },
      { to: "/projects/project-1?tab=check-ins", label: "Check-Ins" },
    ]);
  });

  it("falls back to company work map when the check-in has no space", () => {
    const checkIn = {
      id: "check-in-1",
      project: { id: "project-1", name: "Apollo" },
    } as ProjectCheckIn;

    const items = buildProjectCheckInEditNavigation(checkIn, paths);

    expect(items).toEqual([
      { to: "/work-map/projects", label: "Work Map" },
      { to: "/projects/project-1", label: "Apollo" },
      { to: "/projects/project-1?tab=check-ins", label: "Check-Ins" },
    ]);
    expect(items.some((item) => item.label === "Operations")).toBe(false);
  });
});
