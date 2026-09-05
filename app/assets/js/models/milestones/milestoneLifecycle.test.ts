import Api from "@/api";
import { QueryClient } from "@tanstack/react-query";
import { invalidateMilestoneLifecycleQueries } from "./milestoneLifecycle";

describe("milestone lifecycle queries", () => {
  beforeAll(() => {
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company-1" });
  });

  it("invalidates milestone detail and supporting queries", async () => {
    const queryClient = createQueryClient();
    const milestoneKey = Api.projects.getMilestoneQueryKey({ id: "milestone-1", includeProject: true });
    const tasksKey = Api.projects.listMilestoneTasksQueryKey({ milestoneId: "milestone-1" });
    const childrenCountKey = Api.projects.countChildrenQueryKey({ id: "milestone-1", useMilestoneId: true });
    const activitiesKey = Api.companies.listActivitiesQueryKey({
      scopeId: "milestone-1",
      scopeType: "milestone",
      actions: ["milestone_description_updating"],
    });
    const unrelatedKey = Api.projects.getQueryKey({ id: "project-1" });

    [milestoneKey, tasksKey, childrenCountKey, activitiesKey, unrelatedKey].forEach((queryKey) => {
      queryClient.setQueryData(queryKey, {});
    });

    await invalidateMilestoneLifecycleQueries(queryClient);

    expect(queryClient.getQueryState(milestoneKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(tasksKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(childrenCountKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(activitiesKey)?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(unrelatedKey)?.isInvalidated).toBe(false);
  });
});

function createQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}
