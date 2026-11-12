/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { renderHook } from "@/__tests__/renderHook";
import Api from "@/api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { invalidateTaskLifecycleQueries, taskMoveErrorResult, useTaskMoveBoards } from "./taskLifecycle";

describe("task lifecycle queries", () => {
  beforeAll(() => {
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company-1" });
  });

  it("invalidates task detail and affected task surface queries", async () => {
    const queryClient = createQueryClient();
    const taskKey = Api.tasks.getQueryKey({ id: "task-1", includeProject: true });
    const commentsKey = Api.comments.listQueryKey({ entityId: "task-1", entityType: "project_task" });
    const activitiesKey = Api.companies.listActivitiesQueryKey({
      scopeId: "task-1",
      scopeType: "task",
      actions: ["task_name_updating"],
    });
    const childrenCountKey = Api.projects.countChildrenQueryKey({ id: "task-1", useTaskId: true });
    const milestoneKey = Api.projects.getMilestoneQueryKey({ id: "milestone-1", includeProject: true });
    const milestoneTasksKey = Api.projects.listMilestoneTasksQueryKey({ milestoneId: "milestone-1" });
    const spaceKey = Api.spaces.getQueryKey({ id: "space-1", includePermissions: true });
    const boardKey = Api.tasks.getBoardQueryKey({ spaceId: "space-1", boardId: "board-2" });
    const spaceTasksKey = Api.spaces.listTasksQueryKey({ spaceId: "space-1" });
    const projectKey = Api.projects.getQueryKey({ id: "project-1" });
    const projectTasksKey = Api.tasks.listQueryKey({ projectId: "project-1" });
    queryClient.setQueryData(projectKey, {});
    queryClient.setQueryData(projectTasksKey, {});
    const unrelatedKey = Api.people.getQueryKey({ id: "person-1" });

    [
      taskKey,
      boardKey,
      commentsKey,
      activitiesKey,
      childrenCountKey,
      milestoneKey,
      milestoneTasksKey,
      spaceKey,
      spaceTasksKey,
      unrelatedKey,
    ].forEach((queryKey) => {
      queryClient.setQueryData(queryKey, {});
    });

    await invalidateTaskLifecycleQueries(queryClient);

    expect(queryClient.getQueryState(boardKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(taskKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(commentsKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(activitiesKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(childrenCountKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(milestoneKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(milestoneTasksKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(spaceKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(spaceTasksKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(projectKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(projectTasksKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(unrelatedKey)?.isInvalidated).toBe(false);
  });
});

function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

it("loads fresh active boards through the generated query for each destination selection", async () => {
  const client = new QueryClient();
  const queryFn = jest.fn().mockResolvedValue({ boards: [] });
  Api.default.setBasePath("/api/v2");
  Api.default.setHeaders({ "x-company-id": "company" });
  const options = Api.tasks.listBoardsQueryOptions;
  const spy = jest
    .spyOn(Api.tasks, "listBoardsQueryOptions")
    .mockImplementation((input) => ({ ...options(input), queryFn }));
  const { result } = renderHook(useTaskMoveBoards, {
    initialProps: undefined,
    wrapper: ({ children }) => React.createElement(QueryClientProvider, { client }, children),
  });
  await result.current("space");
  await result.current("space");
  expect(Api.tasks.listBoardsQueryOptions).toHaveBeenCalledWith({ spaceId: "space", archiveStatus: "active" });
  expect(queryFn).toHaveBeenCalledTimes(2);
  client.clear();
  spy.mockRestore();
});

it("preserves the API's status mapping and archive errors for the move dialog", () => {
  const statuses = [{ id: "review", label: "Review" }];
  const error = (details: unknown) => ({ isAxiosError: true, response: { data: { details } } });
  expect(taskMoveErrorResult(error({ code: "task_board_status_mapping_required", task_statuses: statuses }))).toEqual({
    status: "status_mapping_required",
    statuses,
  });
  expect(taskMoveErrorResult(error({ code: "task_board_archived" }))).toEqual({ status: "board_unavailable" });
  expect(taskMoveErrorResult(new Error("Network error"))).toBe(false);
});
