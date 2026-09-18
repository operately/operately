import Api from "@/api";
import { compareIds } from "@/routes/paths";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.spaces.createMutationOptions(),
    onSuccess: ({ space }) => {
      return invalidateSpaceLifecycleQueries(queryClient, space?.id);
    },
  });
}

export function useEditSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.spaces.updateMutationOptions(),
    onSuccess: ({ space }, { id }) => {
      return invalidateSpaceLifecycleQueries(queryClient, space?.id ?? id);
    },
  });
}

export function useUpdateSpaceTools() {
  const queryClient = useQueryClient();

  return useMutation({
    ...Api.spaces.updateToolsMutationOptions(),
    onSuccess: (_data, { spaceId }) => {
      return invalidateSpaceToolsQueries(queryClient, spaceId);
    },
  });
}

export function useDeleteSpace() {
  const client = useQueryClient();

  return useMutation({
    ...Api.spaces.deleteMutationOptions(),
    onSuccess: (_result, { spaceId }) => invalidateDeletedSpaceQueries(client, spaceId),
  });
}

export async function invalidateSpaceToolsQueries(
  queryClient: QueryClient,
  spaceId: string,
  refetchType: "active" | "none" = "active",
): Promise<void> {
  await Promise.all([
    invalidateMatchingSpaceQueries(queryClient, Api.spaces.getQueryKeyPrefix(), "id", spaceId, refetchType),
    invalidateMatchingSpaceQueries(queryClient, Api.spaces.listToolsQueryKeyPrefix(), "spaceId", spaceId, refetchType),
  ]);
}

export async function invalidateSpaceLifecycleQueries(
  queryClient: QueryClient,
  spaceId?: string | null,
): Promise<void> {
  await Promise.all([
    spaceId
      ? invalidateMatchingSpaceQueries(queryClient, Api.spaces.getQueryKeyPrefix(), "id", spaceId)
      : Promise.resolve(),
    queryClient.invalidateQueries({ queryKey: Api.spaces.listQueryKeyPrefix() }),
    queryClient.invalidateQueries({ queryKey: Api.spaces.countByAccessLevelQueryKeyPrefix() }),
    queryClient.invalidateQueries({ queryKey: Api.spaces.searchQueryKeyPrefix() }),
    spaceId
      ? invalidateMatchingSpaceQueries(queryClient, Api.spaces.listToolsQueryKeyPrefix(), "spaceId", spaceId)
      : queryClient.invalidateQueries({ queryKey: Api.spaces.listToolsQueryKeyPrefix() }),
    queryClient.invalidateQueries({ queryKey: Api.companies.getWorkMapQueryKeyPrefix() }),
    queryClient.invalidateQueries({ queryKey: Api.companies.getFlatWorkMapQueryKeyPrefix() }),
    invalidateEmbeddedSpaceNameQueries(queryClient),
  ]);
}

async function invalidateMatchingSpaceQueries(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  field: string,
  id: string,
  refetchType: "active" | "none" = "active",
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey,
    refetchType,
    predicate: (query) => {
      const input = query.queryKey[queryKey.length] as Record<string, unknown> | undefined;
      const resourceId = input?.[field];
      return typeof resourceId === "string" && compareIds(resourceId, id);
    },
  });
}

async function invalidateEmbeddedSpaceNameQueries(queryClient: QueryClient): Promise<void> {
  const prefixes = [
    Api.projects.getQueryKeyPrefix(),
    Api.projects.listQueryKeyPrefix(),
    Api.goals.getQueryKeyPrefix(),
    Api.goals.listQueryKeyPrefix(),
    Api.resource_hubs.getQueryKeyPrefix(),
    Api.resource_hubs.getFolderQueryKeyPrefix(),
  ];

  await Promise.all(
    prefixes.map((queryKey) =>
      queryClient.invalidateQueries({
        queryKey,
        predicate: (query) => {
          const input = query.queryKey[queryKey.length] as { includeSpace?: boolean | null } | undefined;
          return input?.includeSpace === true;
        },
      }),
    ),
  );
}

export async function invalidateDeletedSpaceQueries(client: QueryClient, spaceId: string): Promise<void> {
  const workMapPrefix = Api.companies.getWorkMapQueryKeyPrefix();

  await Promise.all([
    client.invalidateQueries({ queryKey: Api.companies.getFlatWorkMapQueryKeyPrefix() }),
    // Revalidate on the next visit, after navigating away from the deleted space.
    invalidateMatchingSpaceQueries(client, Api.spaces.getQueryKeyPrefix(), "id", spaceId, "none"),
    client.invalidateQueries({ queryKey: Api.spaces.listQueryKeyPrefix() }),
    client.invalidateQueries({ queryKey: Api.spaces.countByAccessLevelQueryKeyPrefix() }),
    client.invalidateQueries({ queryKey: Api.spaces.searchQueryKeyPrefix() }),
    client.invalidateQueries({
      queryKey: workMapPrefix,
      predicate: (query) => {
        const input = query.queryKey[workMapPrefix.length] as { spaceId?: string } | undefined;
        return !compareIds(input?.spaceId, spaceId);
      },
    }),
  ]);
}
