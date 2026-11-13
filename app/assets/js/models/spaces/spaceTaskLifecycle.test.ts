import Api from "@/api";
import { QueryClient } from "@tanstack/react-query";
import { invalidateSpaceTaskQueries, writeCachedSpaceKanbanState } from "./spaceTaskLifecycle";

describe("space task lifecycle queries", () => {
  beforeAll(() => {
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company-1" });
  });

  it("invalidates space detail and task list queries", async () => {
    const queryClient = createQueryClient();
    const spaceKey = Api.spaces.getQueryKey({ id: "space-1", includePermissions: true });
    const spaceTasksKey = Api.tasks.listQueryKey({ spaceId: "space-1" });
    const unrelatedKey = Api.spaces.listQueryKey({ includePermissions: true });

    [spaceKey, spaceTasksKey, unrelatedKey].forEach((queryKey) => queryClient.setQueryData(queryKey, {}));

    await invalidateSpaceTaskQueries(queryClient);

    expect(queryClient.getQueryState(spaceKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(spaceTasksKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(unrelatedKey)?.isInvalidated).toBe(false);
  });

  it("writes kanban state into the matching space query without refetching", async () => {
    const queryClient = createQueryClient();
    const spaceKey = Api.spaces.getQueryKey({ id: "space-1", includePermissions: true });
    const otherSpaceKey = Api.spaces.getQueryKey({ id: "space-2", includePermissions: true });
    const spaceTasksKey = Api.tasks.listQueryKey({ spaceId: "space-1" });
    const nextKanbanState = '{"pending":["task-1"]}';

    queryClient.setQueryData(spaceKey, {
      space: { id: "space-1", defaultTaskBoardId: "board-1", tasksKanbanState: "old" },
    });
    queryClient.setQueryData(otherSpaceKey, { space: { id: "space-2", tasksKanbanState: "old" } });
    queryClient.setQueryData(spaceTasksKey, { tasks: [{ id: "task-1" }] });

    writeCachedSpaceKanbanState(queryClient, "space-1", nextKanbanState, "board-1");
    await invalidateSpaceTaskQueries(queryClient, "none");

    expect(queryClient.getQueryData(spaceKey)).toEqual({
      space: { id: "space-1", defaultTaskBoardId: "board-1", tasksKanbanState: nextKanbanState },
    });
    expect(queryClient.getQueryData(otherSpaceKey)).toEqual({
      space: { id: "space-2", tasksKanbanState: "old" },
    });
    expect(queryClient.getQueryData(spaceTasksKey)).toEqual({ tasks: [{ id: "task-1" }] });
    expect(queryClient.getQueryState(spaceKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(spaceTasksKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(spaceKey)?.fetchStatus).toBe("idle");
    expect(queryClient.getQueryState(spaceTasksKey)?.fetchStatus).toBe("idle");
  });

  it("updates another board without overwriting the default board's cached ordering", () => {
    const queryClient = createQueryClient();
    const spaceKey = Api.spaces.getQueryKey({ id: "space-1" });
    const defaultKey = Api.tasks.getBoardQueryKey({ spaceId: "space-1", boardId: "default" });
    const otherKey = Api.tasks.getBoardQueryKey({ spaceId: "space-1", boardId: "other" });
    const space = { id: "space-1", defaultTaskBoardId: "default", tasksKanbanState: "old" };
    queryClient.setQueryData(spaceKey, { space });
    queryClient.setQueryData(defaultKey, { board: { id: "default", tasksKanbanState: "old" } });
    queryClient.setQueryData(otherKey, { board: { id: "other", tasksKanbanState: "old" } });

    writeCachedSpaceKanbanState(queryClient, "space-1", "new", "other");

    expect(queryClient.getQueryData(spaceKey)).toEqual({ space });
    expect(queryClient.getQueryData(defaultKey)).toEqual({ board: { id: "default", tasksKanbanState: "old" } });
    expect(queryClient.getQueryData(otherKey)).toEqual({ board: { id: "other", tasksKanbanState: "new" } });
  });
});

function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}
