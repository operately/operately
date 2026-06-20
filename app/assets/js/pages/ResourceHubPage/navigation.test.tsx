import { paths, project, resourceHub } from "@/__tests__/resourceHubNavigationTestHelpers";
import { buildResourceHubPageNavigation } from "./navigation";

describe("buildResourceHubPageNavigation", () => {
  it("builds project-backed hub breadcrumbs", () => {
    expect(
      buildResourceHubPageNavigation(
        resourceHub({
          project: project(),
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
