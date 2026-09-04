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
    const spaceTasksKey = Api.spaces.listTasksQueryKey({ spaceId: "space-1" });
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
    const spaceTasksKey = Api.spaces.listTasksQueryKey({ spaceId: "space-1" });
    const nextKanbanState = '{"pending":["task-1"]}';

    queryClient.setQueryData(spaceKey, { space: { id: "space-1", tasksKanbanState: "old" } });
    queryClient.setQueryData(otherSpaceKey, { space: { id: "space-2", tasksKanbanState: "old" } });
    queryClient.setQueryData(spaceTasksKey, { tasks: [{ id: "task-1" }] });

    writeCachedSpaceKanbanState(queryClient, "space-1", nextKanbanState);
    await invalidateSpaceTaskQueries(queryClient, "none");

    expect(queryClient.getQueryData(spaceKey)).toEqual({
      space: { id: "space-1", tasksKanbanState: nextKanbanState },
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
});

function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}
