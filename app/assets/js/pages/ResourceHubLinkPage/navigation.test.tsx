import { goal, link, paths, resourceHub } from "@/__tests__/resourceHubNavigationTestHelpers";
import { buildLinkPageNavigation } from "./navigation";

describe("buildLinkPageNavigation", () => {
  it("appends folder ancestors after the goal docs crumb", () => {
    expect(
      buildLinkPageNavigation(
        link({
          goal: goal(),
          pathToLink: [{ id: "folder-1", name: "Folder" }],
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
      { to: "/folders/folder-1", label: "Folder" },
    ]);
  });
});
