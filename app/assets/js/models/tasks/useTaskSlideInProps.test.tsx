/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Api from "@/api";
import { TASK_ACTIVITY_TYPES } from "@/models/activities/feed";
import { useTaskSlideInProps } from "./useTaskSlideInProps";

const mockMoveTask = jest.fn();
const mockNavigate = jest.fn();

jest.mock("@/models/activities/feed", () => ({ TASK_ACTIVITY_TYPES: ["task_name_updating"] }));
jest.mock("turboui", () => ({ showErrorToast: jest.fn() }));
jest.mock("@/models/comments/useOptimisticComments", () => ({ useOptimisticComments: () => ({ comments: [] }) }));
jest.mock("@/models/subscriptions", () => ({ useSubscription: () => ({}) }));
jest.mock("@/models/people", () => ({}));
jest.mock("@/routes/paths", () => ({ compareIds: (a: string, b: string) => a === b }));
jest.mock("@/hooks/useFormattedTimePreferences", () => ({ useFormattedTimePreferences: () => ({}) }));
jest.mock("react-router", () => ({ useNavigate: () => mockNavigate }));
jest.mock("./taskLifecycle", () => ({
  ...jest.requireActual("./taskLifecycle"),
  useMoveTask: () => ({ mutateAsync: mockMoveTask }),
}));
jest.mock("./prepareTaskTimelineItems", () => ({ prepareTaskTimelineItems: () => [] }));

describe("task slide-in field changes", () => {
  let root: Root;
  let client: QueryClient;
  let save: jest.Mock;
  let onMoveTaskSuccess: jest.Mock;
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
    onMoveTaskSuccess = jest.fn().mockResolvedValue(undefined);
    mockMoveTask.mockReset();
    mockNavigate.mockReset();
    const options = {
      backendTasks: [],
      tasks: [],
      currentUser: null,
      paths: {
        taskPath: (taskId: string) => `/tasks/${taskId}`,
        spaceKanbanPath: (spaceId: string, boardId: string, opts: { taskId: string }) =>
          `/spaces/${spaceId}/boards/${boardId}?taskId=${opts.taskId}`,
      },
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
      onMoveTaskSuccess,
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

  it.each([
    {
      destinationType: "project",
      destinationId: "destination-project",
      expectedPath: "/tasks/moved-task",
    },
    {
      destinationType: "space",
      destinationId: "destination-space",
      expectedPath: "/spaces/destination-space/boards/destination-board?taskId=moved-task",
    },
  ])("navigates to the $destinationType returned by a successful move", async (destination) => {
    mockMoveTask.mockResolvedValue({
      task: { id: "moved-task" },
      destinationType: destination.destinationType,
      destinationId: destination.destinationId,
      boardId: destination.destinationType === "space" ? "destination-board" : null,
    });

    const moved = await moveSlideInTask(hook);

    expect(moved).toBe(true);
    expect(onMoveTaskSuccess).toHaveBeenCalledWith({
      movedTaskId: "moved-task",
      destinationType: destination.destinationType,
      destinationId: destination.destinationId,
      boardId: destination.destinationType === "space" ? "destination-board" : null,
    });
    expect(mockNavigate).toHaveBeenCalledWith(destination.expectedPath);
  });

  it("passes explicit board/status selectors and returns mapping errors without navigating", async () => {
    const statuses = [{ id: "review", label: "Review" }];
    mockMoveTask.mockRejectedValue({
      isAxiosError: true,
      response: { data: { details: { code: "task_board_status_mapping_required", task_statuses: statuses } } },
    });
    const input = {
      destinationType: "space" as const,
      destinationId: "requested-space",
      destinationBoardId: "other-board",
      destinationStatusId: "review",
    };
    const result = await moveSlideInTask(hook, input);
    expect(mockMoveTask).toHaveBeenCalledWith({ taskId: "source-task", ...input });
    expect(result).toEqual({ status: "status_mapping_required", statuses });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("stays on the source page when the move is rejected", async () => {
    mockMoveTask.mockRejectedValue(new Error("Move rejected"));

    const moved = await moveSlideInTask(hook);

    expect(moved).toBe(false);
    expect(onMoveTaskSuccess).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

async function moveSlideInTask(
  hook: ReturnType<typeof useTaskSlideInProps>,
  input: import("turboui").TaskPage.MoveTaskInput = { destinationType: "space", destinationId: "requested-space" },
) {
  const taskPageProps = hook.getTaskPageProps("source-task", {
    tasks: [
      {
        id: "source-task",
        title: "Source task",
        description: null,
        assignees: [],
        milestone: null,
        status: null,
        dueDate: null,
        reminders: [],
      },
    ],
    statuses: [],
    richTextHandlers: {},
  });

  if (!taskPageProps) throw new Error("Expected slide-in props for source task");
  if (!taskPageProps.onMoveTask) throw new Error("Expected move handler for source task");

  return taskPageProps.onMoveTask(input);
}
