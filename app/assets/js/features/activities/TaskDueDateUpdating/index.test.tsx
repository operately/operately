/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";
import { aggregateConsecutiveFeedActivities, type Activity } from "@/models/activities";
import { usePaths } from "@/routes/paths";
import Handler from ".";
import type { ActivityContentTaskDueDateUpdating } from "@/api";

jest.mock("@/contexts/TimezoneContext", () => ({ useLocale: () => "en" }));
jest.mock("@/routes/paths", () => ({
  usePaths: () => ({
    spacePath: (id: string) => `/spaces/${id}`,
    spaceKanbanPath: (id: string, boardId: string, { taskId }: { taskId: string }) =>
      `/spaces/${id}/boards/${boardId}?taskId=${taskId}`,
  }),
}));

test("wires compact aggregated due-date updates while retaining the location rule", async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const items = Array.from(
    { length: 4 },
    (_, index): Omit<Activity, "content"> & { content: ActivityContentTaskDueDateUpdating } => ({
      __typename: "activity",
      id: `activity-${index}`,
      action: "task_due_date_updating",
      insertedAt: "2026-10-28T15:21:00Z",
      author: {
        __typename: "person",
        id: "author",
        fullName: "Igor",
        title: "Engineer",
        email: "igor@example.com",
        avatarUrl: null,
        type: "human",
      },
      content: {
        __typename: "activity_content_task_due_date_updating",
        project: null,
        taskName: `Task ${index}`,
        oldDueDate: { __typename: "contextual_date", dateType: "day", value: "2026-10-28", date: "2026-10-28" },
        newDueDate: { __typename: "contextual_date", dateType: "day", value: "2026-11-02", date: "2026-11-02" },
        space: { __typename: "space", id: "space", name: "Custom automations" },
        task: { __typename: "task", boardId: "board-1", id: `task-${index}`, name: `Task ${index}`, type: "space" },
      },
    }),
  );
  // The generated ActivityContent union omits this action; validate its actual content type above.
  const item = aggregateConsecutiveFeedActivities(items as Activity[])[0];
  if (!item) throw new Error("Expected an aggregate");
  const container = document.createElement("div");
  const root = createRoot(container);
  try {
    await act(async () =>
      root.render(
        <MemoryRouter>
          <Handler.FeedItemTitle activity={item} page="space" paths={usePaths()} />
        </MemoryRouter>,
      ),
    );
    expect(Array.from(container.querySelectorAll("a")).map((link) => link.getAttribute("href"))).toEqual([
      "/spaces/space/boards/board-1?taskId=task-0",
      "/spaces/space/boards/board-1?taskId=task-1",
      "/spaces/space/boards/board-1?taskId=task-2",
    ]);
    expect(
      container.querySelector('[data-test-id="activity-task-list-disclosure"]')?.getAttribute("aria-expanded"),
    ).toBe("false");
    expect(Handler.FeedItemContent({ activity: item, page: "space", paths: usePaths() })).toBeNull();
  } finally {
    await act(async () => root.unmount());
  }
});
