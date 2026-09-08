import Api from "@/api";
import { QueryClient } from "@tanstack/react-query";
import { invalidateSubscriptionQueries, SubscriptionEntityType } from "./subscriptionLifecycle";

it.each<SubscriptionEntityType>(["project", "milestone", "project_task", "space_task", "kpi"])(
  "invalidates subscription and parent queries for %s without invalidating unrelated resources",
  async (entityType) => {
    Api.default.setBasePath("/api/v2");
    Api.default.setHeaders({ "x-company-id": "company-1" });
    const client = new QueryClient();
    const keys = {
      project: Api.projects.getQueryKey({ id: "project-1" }),
      milestone: Api.projects.getMilestoneQueryKey({ id: "milestone-1" }),
      task: Api.tasks.getQueryKey({ id: "task-1", includeSubscriptionList: true }),
      tasks: Api.tasks.listQueryKey({ projectId: "project-1" }),
      milestoneTasks: Api.projects.listMilestoneTasksQueryKey({ milestoneId: "milestone-1" }),
      spaceTasks: Api.spaces.listTasksQueryKey({ spaceId: "space-1" }),
      kpi: Api.kpis.getKpiQueryKey({ kpiId: "kpi-1" }),
      kpis: Api.kpis.listKpisQueryKey({ spaceId: "space-1" }),
      subscription: Api.notifications.isSubscribedQueryKey({ resourceId: "task-1", resourceType: "project_task" }),
      unrelated: Api.comments.listQueryKey({ entityId: "task-1", entityType: "project_task" }),
    };
    Object.values(keys).forEach((key) => client.setQueryData(key, {}));
    const expected =
      entityType === "project"
        ? ["project"]
        : entityType === "milestone"
          ? ["milestone"]
          : entityType === "kpi"
            ? ["kpi", "kpis"]
            : ["task", "tasks", "milestoneTasks", "spaceTasks"];
    await invalidateSubscriptionQueries(client, entityType);
    Object.entries(keys).forEach(([name, key]) =>
      expect(client.getQueryState(key)?.isInvalidated).toBe(name === "subscription" || expected.includes(name)),
    );
    client.clear();
  },
);
