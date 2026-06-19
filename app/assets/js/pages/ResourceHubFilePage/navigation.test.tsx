import { file, paths, project, resourceHub } from "@/__tests__/resourceHubNavigationTestHelpers";
import { buildFilePageNavigation } from "./navigation";

describe("buildFilePageNavigation", () => {
  it("builds project-backed breadcrumbs", () => {
    expect(
      buildFilePageNavigation(
        file({
          project: project(),
          resourceHub: resourceHub(),
          space: null,
        }),
        paths,
      ),
    ).toEqual([
      { to: "/spaces/space-1", label: "General" },
      { to: "/spaces/space-1/work-map?tab=projects", label: "Work Map" },
      { to: "/projects/project-1?tab=overview", label: "Improve paid acquisition conversion" },
      { to: "/projects/project-1?tab=docs-and-files", label: "Docs & Files" },
    ]);
  });
});
