import Api from "@/api";
import { QueryClient, useMutation } from "@tanstack/react-query";

export type SubscriptionEntityType = "project" | "milestone" | "project_task" | "space_task" | "kpi";

export async function invalidateSubscriptionQueries(queryClient: QueryClient, entityType: SubscriptionEntityType) {
  const parentKeys = {
    project: [Api.projects.getQueryKeyPrefix()],
    milestone: [Api.projects.getMilestoneQueryKeyPrefix()],
    project_task: [
      Api.tasks.getQueryKeyPrefix(),
      Api.tasks.listQueryKeyPrefix(),
      Api.projects.listMilestoneTasksQueryKeyPrefix(),
      Api.spaces.listTasksQueryKeyPrefix(),
    ],
    space_task: [
      Api.tasks.getQueryKeyPrefix(),
      Api.tasks.listQueryKeyPrefix(),
      Api.projects.listMilestoneTasksQueryKeyPrefix(),
      Api.spaces.listTasksQueryKeyPrefix(),
    ],
    kpi: [Api.kpis.getKpiQueryKeyPrefix(), Api.kpis.listKpisQueryKeyPrefix()],
  };
  await Promise.all(
    [Api.notifications.isSubscribedQueryKeyPrefix(), ...parentKeys[entityType]].map((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    ),
  );
}

// The sidebar batches invalidation after its queued toggles settle.
export function useSubscribeToResource() {
  return useMutation(Api.notifications.subscribeMutationOptions());
}

export function useUnsubscribeFromResource() {
  return useMutation(Api.notifications.unsubscribeMutationOptions());
}
