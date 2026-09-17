import Api from "@/api";
import { useGoalMutation } from "./goalMutation";
import { QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
import { compareIds } from "@/routes/paths";
import { invalidateGoalPageQueries, invalidateGoalResourceQueries } from "./goalPageQueries";

export async function invalidateGoalAccessQueries(client: QueryClient, goalId: string): Promise<void> {
  const peoplePrefix = Api.people.getBindedQueryKeyPrefix();

  await Promise.all([
    invalidateGoalPageQueries(client, goalId),
    invalidateGoalResourceQueries(client, Api.goals.listAccessMembersQueryKeyPrefix(), "goalId", goalId),
    client.invalidateQueries({
      queryKey: peoplePrefix,
      predicate: (query) => {
        const input = query.queryKey[peoplePrefix.length] as { resourseType?: string; resourseId?: string } | undefined;
        return input?.resourseType === "goal" && compareIds(input.resourseId, goalId);
      },
    }),
    client.invalidateQueries({ queryKey: Api.goals.listQueryKeyPrefix() }),
    client.invalidateQueries({ queryKey: Api.companies.getWorkMapQueryKeyPrefix() }),
    client.invalidateQueries({ queryKey: Api.companies.getFlatWorkMapQueryKeyPrefix() }),
    client.invalidateQueries({ queryKey: Api.companies.listActivitiesQueryKeyPrefix() }),
  ]);
}

export function useCreateGoalAccessMembers() {
  const client = useQueryClient();

  return useMutation({
    ...Api.goals.createAccessMembersMutationOptions(),
    onSuccess: (_result, { goalId }) => invalidateGoalAccessQueries(client, goalId),
  });
}

export function useUpdateGoalAccessMember() {
  const client = useQueryClient();

  return useMutation({
    ...Api.goals.updateAccessMemberMutationOptions(),
    onSuccess: (_result, { goalId }) => invalidateGoalAccessQueries(client, goalId),
  });
}

export function useDeleteGoalAccessMember() {
  const client = useQueryClient();

  return useMutation({
    ...Api.goals.deleteAccessMemberMutationOptions(),
    onSuccess: (_result, { goalId }) => invalidateGoalAccessQueries(client, goalId),
  });
}

export function useUpdateGoalAccessLevels() {
  return useGoalMutation(Api.goals.updateAccessLevelsMutationOptions(), (client, { goalId }) =>
    invalidateGoalAccessQueries(client, goalId),
  );
}
