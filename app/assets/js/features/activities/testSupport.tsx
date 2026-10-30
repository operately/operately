import React, { act } from "react";
import { createRoot } from "react-dom/client";
import type { Activity } from "@/api";
import type { Paths } from "@/routes/paths";

export const feedTestPaths = {
  taskPath: (id: string) => `/tasks/${id}`,
  spaceKanbanPath: (id: string, params?: { taskId: string }) =>
    `/spaces/${id}/tasks${params?.taskId ? `?task=${params.taskId}` : ""}`,
  projectPath: (id: string) => `/projects/${id}`,
  spacePath: (id: string) => `/spaces/${id}`,
  projectMilestonePath: (id: string) => `/milestones/${id}`,
} as unknown as Paths;

export function feedTestActivity(action: string, index: number, overrides: Record<string, unknown> = {}): Activity {
  return {
    __typename: "activity",
    id: `activity-${index}`,
    action,
    insertedAt: `2026-09-09T12:${String(index).padStart(2, "0")}:00Z`,
    author: { __typename: "person", id: "author", fullName: "Alex Rivera", type: "human" },
    content: {
      project: { id: "project", name: "Website" },
      space: { id: "space", name: "Product" },
      task: { id: `task-${index}`, name: `Task ${index} <literal>, & punctuation` },
      taskName: `Stored task ${index}`,
      name: `Stored task ${index}`,
      archived: true,
      milestone: { id: `milestone-${index}`, title: `Milestone ${index}` },
      milestoneName: `Milestone ${index}`,
      oldMilestoneName: `Old ${index}`,
      newMilestoneName: `New ${index}`,
      oldTitle: `Old ${index}`,
      newTitle: `New ${index}`,
      oldMilestone: { id: "old-milestone", title: "Old milestone" },
      newMilestone: { id: "new-milestone", title: "New milestone" },
      originType: "project",
      destinationType: "space",
      originProject: { id: "origin", name: "Origin" },
      destinationSpace: { id: "destination", name: "Destination" },
      commentAction: "complete",
      comment: { id: `comment-${index}`, content: "{}" },
      addedAssignees: [],
      removedAssignees: [],
      oldDueDate: { dateType: "day", value: "2026-09-10", date: "2026-09-10" },
      newDueDate: { dateType: "day", value: "2026-09-20", date: "2026-09-20" },
      oldStatus: { label: "Todo" },
      newStatus: { label: "Done" },
      oldTimeframe: null,
      newTimeframe: null,
      ...overrides,
    },
  } as unknown as Activity;
}

export async function renderFeedTest(element: React.ReactNode) {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => root.render(element));
  return {
    container,
    rerender: async (element: React.ReactNode) => {
      await act(async () => root.render(element));
    },
    toggle: async () => {
      await act(async () =>
        container.querySelector<HTMLButtonElement>("[data-test-id=activity-resource-toggle]")?.click(),
      );
    },
    cleanup: async () => {
      await act(async () => root.unmount());
      container.remove();
    },
  };
}
