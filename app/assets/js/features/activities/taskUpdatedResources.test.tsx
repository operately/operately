/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { aggregateConsecutiveFeedActivities } from "@/models/activities";
import { UpdatedTaskList, updatedTasksForFeed } from "./taskUpdatedResources";
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
jest.mock("turboui", () => jest.requireActual("../../../../../turboui/src/ActivityResourceList"));

test.each([
  "task_adding",
  "task_assignee_updating",
  "task_due_date_updating",
  "task_name_updating",
  "task_status_updating",
  "task_archive_updating",
  "task_moving",
  "task_milestone_updating",
])("previews and expands thirty %s entries in chronological order", async (action) => {
  const batch = Array.from({ length: 30 }, (_, index) => feedTestActivity(action, index)).reverse();
  const activity = aggregateConsecutiveFeedActivities(batch)[0]!;
  const view = await renderFeedTest(<UpdatedTaskList activity={activity} paths={feedTestPaths} />);
  try {
    expect(view.container.querySelectorAll("a")).toHaveLength(3);
    expect(view.container.querySelector("button")?.textContent).toContain("27");
    await view.toggle();
    const expected = batch
      .slice()
      .reverse()
      .map((_, index) =>
        action === "task_moving" ? `/spaces/destination/tasks?task=task-${index}` : `/tasks/task-${index}`,
      );
    expect(Array.from(view.container.querySelectorAll("a")).map((link) => link.getAttribute("href"))).toEqual(expected);
    await view.toggle();
    expect(view.container.querySelectorAll("a")).toHaveLength(3);
  } finally {
    await view.cleanup();
  }
});

test("filters unusable original task links before counting and deduplicates by task ID", async () => {
  const batch = [
    feedTestActivity("task_adding", 0),
    feedTestActivity("task_adding", 1, { task: null }),
    feedTestActivity("task_adding", 2, { project: null, space: null }),
    feedTestActivity("task_adding", 3),
    feedTestActivity("task_adding", 4, { task: { id: "task-0", name: "Repeated" } }),
  ];
  const activity = { ...batch[0]!, aggregatedActivities: batch };
  expect(updatedTasksForFeed(activity, feedTestPaths).map((entry) => entry.key)).toEqual(["task-0", "task-3"]);
  const view = await renderFeedTest(<UpdatedTaskList activity={activity} paths={feedTestPaths} />);
  try {
    expect(view.container.querySelectorAll("a")).toHaveLength(2);
    expect(view.container.querySelector("button")).toBeNull();
  } finally {
    await view.cleanup();
  }
});

test("keeps all thirty deletion records including equal names, without linking deleted tasks", async () => {
  const batch = Array.from({ length: 30 }, (_, index) =>
    feedTestActivity("task_deleting", index, { taskName: "<same> & name" }),
  );
  const activity = { ...batch[0]!, aggregatedActivities: [...batch, batch[0]!] };
  const view = await renderFeedTest(<UpdatedTaskList activity={activity} paths={feedTestPaths} />);
  try {
    expect(view.container.querySelectorAll("[data-test-id=activity-resource-entry]")).toHaveLength(3);
    expect(view.container.querySelector("button")?.textContent).toContain("27");
    await view.toggle();
    expect(view.container.querySelectorAll("[data-test-id=activity-resource-entry]")).toHaveLength(30);
    expect(view.container.querySelectorAll("a")).toHaveLength(0);
    expect(view.container.querySelector("same")).toBeNull();
  } finally {
    await view.cleanup();
  }
});

test("resolves space and moved-project links and retains stored-name fallbacks", () => {
  expect(updatedTasksForFeed(feedTestActivity("task_adding", 0, { project: null }), feedTestPaths)[0]?.path).toBe(
    "/spaces/space/tasks?task=task-0",
  );
  expect(
    updatedTasksForFeed(
      feedTestActivity("task_moving", 0, { destinationType: "project", destinationProject: { id: "destination" } }),
      feedTestPaths,
    )[0]?.path,
  ).toBe("/tasks/task-0");
  for (const action of ["task_archive_updating", "task_moving"]) {
    const entry = updatedTasksForFeed(feedTestActivity(action, 0, { task: null }), feedTestPaths)[0];
    expect(entry?.name).toBe("Stored task 0");
    expect(entry?.path).toBeUndefined();
  }
});
