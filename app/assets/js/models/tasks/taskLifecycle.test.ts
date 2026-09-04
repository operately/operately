import Api from "@/api";
import { QueryClient } from "@tanstack/react-query";
import { invalidateTaskLifecycleQueries } from "./taskLifecycle";

describe("task lifecycle queries", () => {
  beforeAll(() => {
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company-1" });
  });

  it("invalidates task detail, comments, activities, and child count queries", async () => {
    const queryClient = createQueryClient();
    const taskKey = Api.tasks.getQueryKey({ id: "task-1", includeProject: true });
    const commentsKey = Api.comments.listQueryKey({ entityId: "task-1", entityType: "project_task" });
    const activitiesKey = Api.companies.listActivitiesQueryKey({
      scopeId: "task-1",
      scopeType: "task",
      actions: ["task_name_updating"],
    });
    const childrenCountKey = Api.projects.countChildrenQueryKey({ id: "task-1", useTaskId: true });
    const unrelatedKey = Api.tasks.listQueryKey({ projectId: "project-1" });

    [taskKey, commentsKey, activitiesKey, childrenCountKey, unrelatedKey].forEach((queryKey) => {
      queryClient.setQueryData(queryKey, {});
    });

    await invalidateTaskLifecycleQueries(queryClient);

    expect(queryClient.getQueryState(taskKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(commentsKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(activitiesKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(childrenCountKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(unrelatedKey)?.isInvalidated).toBe(false);
  });
});

function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}
