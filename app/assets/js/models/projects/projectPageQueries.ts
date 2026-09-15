import { useCallback } from "react";
import { type QueryClient, type QueryKey, useQueryClient } from "@tanstack/react-query";
import Api, {
  type CompaniesGetActivityInput,
  type NotificationsIsSubscribedInput,
  type ProjectsGetCheckInInput,
  type ProjectsGetDiscussionInput,
  type ProjectsGetRetrospectiveInput,
} from "@/api";
import { compareIds } from "@/routes/paths";

// Includes all input variants, so returning from a task or milestone cannot reuse stale project data.
export async function invalidateProjectPageQueries(
  client: QueryClient,
  projectId: string,
  refetchType: "active" | "none" = "none",
) {
  const prefixes = [
    Api.projects.getQueryKeyPrefix(),
    Api.projects.countChildrenQueryKeyPrefix(),
    Api.tasks.listQueryKeyPrefix(),
    Api.projects.listCheckInsQueryKeyPrefix(),
    Api.projects.listDiscussionsQueryKeyPrefix(),
  ];
  await Promise.all(
    prefixes.map((queryKey) =>
      client.invalidateQueries({
        queryKey,
        refetchType,
        predicate: (query) => {
          const input = query.queryKey[queryKey.length] as { id?: string; projectId?: string } | undefined;
          return compareIds(input?.projectId ?? input?.id ?? null, projectId);
        },
      }),
    ),
  );
}

export function useInvalidateProjectPage() {
  const client = useQueryClient();
  return useCallback(
    (id: string, refetchType: "active" | "none" = "none") => invalidateProjectPageQueries(client, id, refetchType),
    [client],
  );
}

export function invalidateProjectCheckInPageQueries(
  client: QueryClient,
  inputs: { queryInput: ProjectsGetCheckInInput; subscriptionInput: NotificationsIsSubscribedInput },
): Promise<void> {
  return invalidateProjectResourcePageQueries(
    client,
    Api.projects.getCheckInQueryKey(inputs.queryInput),
    inputs.subscriptionInput,
  );
}

export function invalidateProjectDiscussionPageQueries(
  client: QueryClient,
  inputs: { queryInput: ProjectsGetDiscussionInput; subscriptionInput: NotificationsIsSubscribedInput },
): Promise<void> {
  return invalidateProjectResourcePageQueries(
    client,
    Api.projects.getDiscussionQueryKey(inputs.queryInput),
    inputs.subscriptionInput,
  );
}

export function invalidateProjectRetrospectivePageQueries(
  client: QueryClient,
  inputs: { queryInput: ProjectsGetRetrospectiveInput; subscriptionInput: NotificationsIsSubscribedInput },
): Promise<void> {
  return invalidateProjectResourcePageQueries(
    client,
    Api.projects.getRetrospectiveQueryKey(inputs.queryInput),
    inputs.subscriptionInput,
  );
}

export function invalidateProjectActivityPageQueries(
  client: QueryClient,
  inputs: { activityInput: CompaniesGetActivityInput; subscriptionInput: NotificationsIsSubscribedInput | null },
): Promise<void> {
  return invalidateProjectResourcePageQueries(
    client,
    Api.companies.getActivityQueryKey(inputs.activityInput),
    inputs.subscriptionInput,
  );
}

async function invalidateProjectResourcePageQueries(
  client: QueryClient,
  resourceQueryKey: QueryKey,
  subscriptionInput: NotificationsIsSubscribedInput | null,
): Promise<void> {
  await Promise.all([
    client.invalidateQueries({ queryKey: resourceQueryKey }),
    subscriptionInput
      ? client.invalidateQueries({ queryKey: Api.notifications.isSubscribedQueryKey(subscriptionInput) })
      : Promise.resolve(),
  ]);
}
