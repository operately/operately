/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Api from "@/api";
import { TASK_ACTIVITY_TYPES } from "@/models/activities/feed";
import { useTaskSlideInProps } from "./useTaskSlideInProps";

jest.mock("@/models/activities/feed", () => ({ TASK_ACTIVITY_TYPES: ["task_name_updating"] }));
jest.mock("turboui", () => ({ showErrorToast: jest.fn() }));
jest.mock("@/models/comments/useOptimisticComments", () => ({ useOptimisticComments: () => ({ comments: [] }) }));
jest.mock("@/models/subscriptions", () => ({ useSubscription: () => ({}) }));
jest.mock("@/models/people", () => ({}));
jest.mock("@/routes/paths", () => ({ compareIds: (a: string, b: string) => a === b }));
jest.mock("@/hooks/useFormattedTimePreferences", () => ({ useFormattedTimePreferences: () => ({}) }));
jest.mock("./taskLifecycle", () => ({ useMoveTask: () => ({ mutateAsync: jest.fn() }) }));
jest.mock("./prepareTaskTimelineItems", () => ({ prepareTaskTimelineItems: () => [] }));

describe("task slide-in field changes", () => {
  let root: Root;
  let client: QueryClient;
  let save: jest.Mock;
  let hook: ReturnType<typeof useTaskSlideInProps>;
  const keys = (id: string) => [
    Api.companies.listActivitiesQueryKey({ scopeId: id, scopeType: "task", actions: TASK_ACTIVITY_TYPES }),
    Api.comments.listQueryKey({ entityId: id, entityType: "project_task" }),
  ];

  beforeEach(async () => {
    (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company-1" });
    client = new QueryClient();
    root = createRoot(document.createElement("div"));
    save = jest.fn().mockResolvedValue(true);
    const options = {
      backendTasks: [],
      tasks: [],
      currentUser: null,
      paths: {},
      commentEntityType: "project_task",
      variant: "project-task",
      canEdit: true,
      canComment: true,
      onTaskNameChange: save,
      onTaskAssigneeChange: save,
      onTaskDueDateChange: save,
      onTaskRemindersChange: save,
      onTaskStatusChange: save,
      onTaskDescriptionChange: save,
    } as unknown as Parameters<typeof useTaskSlideInProps>[0];
    function Harness() {
      hook = useTaskSlideInProps(options);
      return null;
    }
    await act(async () =>
      root.render(
        <QueryClientProvider client={client}>
          <Harness />
        </QueryClientProvider>,
      ),
    );
    [...keys("changed-task"), ...keys("other-task")].forEach((key) => client.setQueryData(key, {}));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    client.clear();
  });

  it.each([
    { field: "name", save: () => hook.onTaskNameChange("changed-task", "New name") },
    { field: "assignees", save: () => hook.onTaskAssigneeChange("changed-task", []) },
    { field: "due date", save: () => hook.onTaskDueDateChange("changed-task", null) },
    { field: "reminders", save: () => hook.onTaskRemindersChange("changed-task", []) },
    { field: "status", save: () => hook.onTaskStatusChange("changed-task", null) },
    { field: "description", save: () => hook.onTaskDescriptionChange("changed-task", {}) },
  ])("$field invalidates the changed task even when no slide-in is open", async (change) => {
    await act(async () => {
      expect(await change.save()).toBe(true);
    });
    expect(save).toHaveBeenCalledTimes(1);
    keys("changed-task").forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
    keys("other-task").forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
  });

  it("leaves the timeline unchanged when a field save fails", async () => {
    save.mockResolvedValue(false);
    await act(async () => {
      expect(await hook.onTaskNameChange("changed-task", "Name")).toBe(false);
    });
    keys("changed-task").forEach((key) => expect(client.getQueryState(key)?.isInvalidated).toBe(false));
  });
});
