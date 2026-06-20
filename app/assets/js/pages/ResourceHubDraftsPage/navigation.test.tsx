import { goal, paths, resourceHub } from "@/__tests__/resourceHubNavigationTestHelpers";
import { buildDraftsPageNavigation } from "./navigation";

describe("buildDraftsPageNavigation", () => {
  it("builds goal-backed drafts breadcrumbs", () => {
    expect(
      buildDraftsPageNavigation(
        resourceHub({
          goal: goal(),
        }),
        paths,
      ),
    ).toEqual([
      { to: "/spaces/space-1", label: "General" },
      { to: "/spaces/space-1/work-map", label: "Work Map" },
      { to: "/goals/goal-1?tab=overview", label: "Make operations repeatable" },
      { to: "/goals/goal-1?tab=docs-and-files", label: "Docs & Files" },
    ]);
  });
});
