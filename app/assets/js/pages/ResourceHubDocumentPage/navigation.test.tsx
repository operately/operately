import { document, goal, paths, resourceHub } from "@/__tests__/resourceHubNavigationTestHelpers";
import { buildDocumentPageNavigation } from "./navigation";

describe("buildDocumentPageNavigation", () => {
  it("builds goal-backed breadcrumbs from the document parent", () => {
    expect(
      buildDocumentPageNavigation(
        document({
          goal: null,
          project: null,
          resourceHub: resourceHub({
            goal: goal(),
            space: null,
          }),
          space: null,
        }),
        resourceHub({
          permissions: { canEdit: true },
          potentialSubscribers: [{ id: "person-1" }],
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
