import { useCallback } from "react";
import { type QueryClient, type QueryFilters, type QueryKey, useQueryClient } from "@tanstack/react-query";
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
  await Promise.all(
    projectPageFilters(projectId).map((filter) => client.invalidateQueries({ ...filter, refetchType })),
  );
}

function projectPageFilters(projectId: string): QueryFilters[] {
  return [
    Api.projects.getQueryKeyPrefix(),
    Api.projects.countChildrenQueryKeyPrefix(),
    Api.tasks.listQueryKeyPrefix(),
    Api.projects.listCheckInsQueryKeyPrefix(),
    Api.projects.listDiscussionsQueryKeyPrefix(),
  ].map((queryKey) => ({
    queryKey,
    predicate: (query) => {
      const input = query.queryKey[queryKey.length] as { id?: string; projectId?: string } | undefined;
      return compareIds(input?.projectId ?? input?.id ?? null, projectId);
    },
  }));
}

export function useInvalidateProjectPage() {
  const client = useQueryClient();
  return useCallback(
    (id: string, refetchType: "active" | "none" = "none") => invalidateProjectPageQueries(client, id, refetchType),
    [client],
  );
}

export async function invalidateProjectResourceHubQueries(client: QueryClient, resourceHubId: string) {
  await Promise.all(
    resourceHubFilters(resourceHubId).map((filter) => client.invalidateQueries({ ...filter, refetchType: "active" })),
  );
}

export async function cancelProjectPageQueries(
  client: QueryClient,
  projectId: string,
  resourceHubId: string | null | undefined,
) {
  const filters = [...projectPageFilters(projectId), ...(resourceHubId ? resourceHubFilters(resourceHubId) : [])];
  await Promise.all(filters.map((filter) => client.cancelQueries(filter)));
}

function resourceHubFilters(resourceHubId: string): QueryFilters[] {
  return [
    Api.resource_hubs.getQueryKeyPrefix(),
    Api.resource_hubs.listNodesQueryKeyPrefix(),
    Api.resource_hubs.listDraftsQueryKeyPrefix(),
  ].map((queryKey) => ({
    queryKey,
    predicate: (query) => {
      const input = query.queryKey[queryKey.length] as { id?: string; resourceHubId?: string } | undefined;
      return compareIds(input?.resourceHubId ?? input?.id ?? null, resourceHubId);
    },
  }));
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
