/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { aggregateConsecutiveFeedActivities } from "@/models/activities";
import { UpdatedMilestoneGroup, updatedMilestonesForFeed } from "./milestoneUpdatedResources";
import { feedTestActivity, feedTestPaths, renderFeedTest } from "./testSupport";

jest.mock("../../../../../turboui/node_modules/react", () => jest.requireActual("react"));
jest.mock("@/contexts/TimezoneContext", () => ({ useLocale: () => "en" }));
jest.mock("../../../../../turboui/src/Link", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
  ActionLink: ({ onClick, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button onClick={onClick} aria-expanded={props["aria-expanded"]} data-test-id="activity-resource-toggle">
      {children}
    </button>
  ),
}));
jest.mock("turboui", () => ({
  ...jest.requireActual("../../../../../turboui/src/ActivityResourceList"),
  ...jest.requireActual("../../../../../turboui/src/Link"),
}));

test.each([
  "project_milestone_creation",
  "project_milestone_updating",
  "milestone_title_updating",
  "milestone_due_date_updating",
  "project_milestone_commented",
])("previews and expands thirty %s entries with associated details", async (action) => {
  const batch = Array.from({ length: 30 }, (_, index) => feedTestActivity(action, index)).reverse();
  const activity = aggregateConsecutiveFeedActivities(batch)[0]!;
  const view = await renderFeedTest(
    <UpdatedMilestoneGroup
      activity={activity}
      page="project"
      paths={feedTestPaths}
      detail={(entry) => <span>{entry.id}</span>}
    />,
  );
  try {
    expect(view.container.querySelectorAll("a")).toHaveLength(3);
    expect(view.container.querySelector("button")?.textContent).toContain("27");
    expect(view.container.textContent).not.toContain("activity-29");
    await view.toggle();
    expect(Array.from(view.container.querySelectorAll("a")).map((link) => link.getAttribute("href"))).toEqual(
      Array.from({ length: 30 }, (_, index) => `/milestones/milestone-${index}`),
    );
    expect(view.container.textContent).toContain("activity-29");
    await view.toggle();
    expect(view.container.querySelectorAll("a")).toHaveLength(3);
  } finally {
    await view.cleanup();
  }
});

test("retains chronological details on repeated milestones and deduplicates repeated activity copies", async () => {
  const batch = [
    feedTestActivity("milestone_title_updating", 0),
    feedTestActivity("milestone_title_updating", 1, { milestone: { id: "milestone-0", title: "Repeated" } }),
    ...[2, 3, 4].map((index) => feedTestActivity("milestone_title_updating", index)),
  ];
  const activity = { ...batch[0]!, aggregatedActivities: [...batch, batch[1]!] };
  const view = await renderFeedTest(
    <UpdatedMilestoneGroup
      activity={activity}
      page="project"
      paths={feedTestPaths}
      detail={(entry) => <span>{entry.id}</span>}
    />,
  );
  try {
    const first = view.container.querySelector("[data-test-id=activity-resource-entry]");
    expect(first?.textContent).toBe("New 0activity-0activity-1");
    expect(view.container.querySelector("button")?.textContent).toContain("1");
    expect(view.container.textContent).not.toContain("activity-4");
    await view.toggle();
    expect(view.container.querySelectorAll("a")).toHaveLength(4);
  } finally {
    await view.cleanup();
  }
});

test("counts deletion identities rather than names and uses literal stored-name fallbacks", async () => {
  const batch = Array.from({ length: 30 }, (_, index) =>
    feedTestActivity("milestone_deleting", index, { milestoneName: "<same>, & milestone" }),
  );
  const activity = { ...batch[0]!, aggregatedActivities: [...batch, batch[0]!] };
  const view = await renderFeedTest(<UpdatedMilestoneGroup activity={activity} page="project" paths={feedTestPaths} />);
  try {
    expect(view.container.querySelector("button")?.textContent).toContain("27");
    await view.toggle();
    expect(view.container.querySelectorAll("[data-test-id=activity-resource-entry]")).toHaveLength(30);
    expect(view.container.querySelectorAll("a")).toHaveLength(0);
    expect(view.container.querySelector("same")).toBeNull();
  } finally {
    await view.cleanup();
  }
  for (const action of [
    "project_milestone_creation",
    "project_milestone_updating",
    "milestone_title_updating",
    "milestone_due_date_updating",
  ]) {
    const entry = updatedMilestonesForFeed(feedTestActivity(action, 0, { milestone: null }), feedTestPaths)[0];
    expect(entry?.path).toBeUndefined();
    expect(entry?.name).toBeTruthy();
  }
});
