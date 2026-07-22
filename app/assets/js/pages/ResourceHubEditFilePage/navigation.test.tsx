import { file, goal, paths, resourceHub } from "@/__tests__/resourceHubNavigationTestHelpers";
import { buildEditFilePageNavigation } from "./navigation";

describe("buildEditFilePageNavigation", () => {
  it("builds goal-backed breadcrumbs", () => {
    expect(
      buildEditFilePageNavigation(
        file({
          goal: goal(),
          resourceHub: resourceHub(),
          space: null,
        }),
        paths,
      ),
    ).toEqual([
      { to: "/spaces/space-1", label: "General" },
      { to: "/spaces/space-1/work-map", label: "Work Map" },
      { to: "/goals/goal-1?tab=overview", label: "Make operations repeatable" },
      { to: "/goals/goal-1?tab=docs-and-files", label: "Docs & Files" },
      { to: "/files/file-1", label: "Goal Checklist" },
    ]);
  });
});
