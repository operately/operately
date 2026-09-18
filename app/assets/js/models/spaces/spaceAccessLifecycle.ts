import Api from "@/api";
import { compareIds } from "@/routes/paths";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
import { invalidateSpaceToolsQueries } from "./spaceLifecycle";

export async function invalidateSpaceAccessQueries(client: QueryClient, spaceId: string): Promise<void> {
  const peoplePrefix = Api.people.getBindedQueryKeyPrefix();

  await Promise.all([
    invalidateSpaceToolsQueries(client, spaceId),
    client.invalidateQueries({
      queryKey: peoplePrefix,
      predicate: (query) => {
        const input = query.queryKey[peoplePrefix.length] as { resourseType?: string; resourseId?: string } | undefined;
        return input?.resourseType === "space" && compareIds(input.resourseId, spaceId);
      },
    }),
    client.invalidateQueries({ queryKey: Api.spaces.listQueryKeyPrefix() }),
    client.invalidateQueries({ queryKey: Api.spaces.countByAccessLevelQueryKeyPrefix() }),
    client.invalidateQueries({ queryKey: Api.spaces.searchQueryKeyPrefix() }),
    client.invalidateQueries({ queryKey: Api.companies.getWorkMapQueryKeyPrefix() }),
    client.invalidateQueries({ queryKey: Api.companies.getFlatWorkMapQueryKeyPrefix() }),
    client.invalidateQueries({ queryKey: Api.companies.listActivitiesQueryKeyPrefix() }),
  ]);
}

export function useAddSpaceMembers() {
  const client = useQueryClient();

  return useMutation({
    ...Api.spaces.addMembersMutationOptions(),
    onSuccess: (_result, { spaceId }) => invalidateSpaceAccessQueries(client, spaceId),
  });
}

export function useRemoveGroupMember() {
  const client = useQueryClient();

  return useMutation({
    ...Api.spaces.deleteMemberMutationOptions(),
    onSuccess: (_result, { spaceId }) => invalidateSpaceAccessQueries(client, spaceId),
  });
}

export function useEditSpaceMembersPermissions() {
  const client = useQueryClient();

  return useMutation({
    ...Api.spaces.updateMembersPermissionsMutationOptions(),
    onSuccess: (_result, { spaceId }) => invalidateSpaceAccessQueries(client, spaceId),
  });
}

export function useEditSpacePermissions() {
  const client = useQueryClient();

  return useMutation({
    ...Api.spaces.updatePermissionsMutationOptions(),
    onSuccess: (_result, { spaceId }) => invalidateSpaceAccessQueries(client, spaceId),
  });
}

export function useJoinSpace() {
  const client = useQueryClient();

  return useMutation({
    ...Api.spaces.joinMutationOptions(),
    onSuccess: (_result, { spaceId }) => invalidateSpaceAccessQueries(client, spaceId),
  });
}
