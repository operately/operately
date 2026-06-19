import { folder, goal, paths, resourceHub } from "@/__tests__/resourceHubNavigationTestHelpers";
import { buildFolderPageNavigation } from "./navigation";

describe("buildFolderPageNavigation", () => {
  it("builds goal-backed breadcrumbs with folder ancestors", () => {
    expect(
      buildFolderPageNavigation(
        folder({
          goal: goal(),
          pathToFolder: [{ id: "folder-1", name: "Parent Folder" }],
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
      { to: "/folders/folder-1", label: "Parent Folder" },
    ]);
  });
});
