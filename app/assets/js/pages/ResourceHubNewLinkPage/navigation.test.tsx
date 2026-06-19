import { folder, paths, project, resourceHub } from "@/__tests__/resourceHubNavigationTestHelpers";
import { buildNewLinkPageNavigation } from "./navigation";

describe("buildNewLinkPageNavigation", () => {
  it("appends folder ancestors after the project docs crumb", () => {
    expect(
      buildNewLinkPageNavigation(
        resourceHub({
          project: project(),
        }),
        folder({
          pathToFolder: [{ id: "folder-1", name: "Folder" }],
        }),
        paths,
      ),
    ).toEqual([
      { to: "/spaces/space-1", label: "General" },
      { to: "/spaces/space-1/work-map?tab=projects", label: "Work Map" },
      { to: "/projects/project-1?tab=overview", label: "Improve paid acquisition conversion" },
      { to: "/projects/project-1?tab=docs-and-files", label: "Docs & Files" },
      { to: "/folders/folder-1", label: "Folder" },
    ]);
  });
});
