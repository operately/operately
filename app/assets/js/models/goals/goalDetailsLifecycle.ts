import Api from "@/api";
import { type QueryClient } from "@tanstack/react-query";
import { compareIds } from "@/routes/paths";
import { useGoalMutation } from "./goalMutation";
import { invalidateGoalAccessQueries } from "./goalAccessLifecycle";
import { invalidateGoalLifecycleQueries } from "./goalLifecycle";
import { invalidateGoalPageQueries } from "./goalPageQueries";

export function useUpdateGoalName() {
  return useGoalMutation(Api.goals.updateNameMutationOptions());
}

export function useUpdateGoalDescription() {
  return useGoalMutation(Api.goals.updateDescriptionMutationOptions());
}

export function useUpdateGoalStartDate() {
  return useGoalMutation(Api.goals.updateStartDateMutationOptions());
}

export function useUpdateGoalDueDate() {
  return useGoalMutation(Api.goals.updateDueDateMutationOptions());
}

export function useUpdateGoalSpace() {
  return useGoalMutation(Api.goals.updateSpaceMutationOptions(), (client, { goalId }) =>
    invalidateGoalAccessQueries(client, goalId),
  );
}

export function useUpdateGoalChampion() {
  return useGoalMutation(Api.goals.updateChampionMutationOptions(), (client, { goalId }) =>
    invalidateGoalAccessQueries(client, goalId),
  );
}

export function useUpdateGoalReviewer() {
  return useGoalMutation(Api.goals.updateReviewerMutationOptions(), (client, { goalId }) =>
    invalidateGoalAccessQueries(client, goalId),
  );
}

export function useUpdateGoalParentGoal(previousParentGoalId?: string | null) {
  return useGoalMutation(
    {
      ...Api.goals.updateParentGoalMutationOptions(),
      onMutate: () => ({ previousParentGoalId }),
    },
    async (
      client,
      { goalId, parentGoalId },
      _result,
      context: { previousParentGoalId?: string | null } | undefined,
    ) => {
      await Promise.all([
        invalidateGoalLifecycleQueries(client, goalId, parentGoalId),
        context?.previousParentGoalId
          ? invalidateGoalPageQueries(client, context.previousParentGoalId)
          : Promise.resolve(),
      ]);
    },
  );
}

async function invalidateDeletedGoalQueries(client: QueryClient, goalId: string, parentGoalId?: string | null) {
  const workMapPrefix = Api.companies.getWorkMapQueryKeyPrefix();
  await Promise.all([
    invalidateGoalPageQueries(client, goalId, "none"),
    parentGoalId ? invalidateGoalPageQueries(client, parentGoalId) : Promise.resolve(),
    client.invalidateQueries({ queryKey: Api.goals.listQueryKeyPrefix() }),
    client.invalidateQueries({ queryKey: Api.companies.listActivitiesQueryKeyPrefix() }),
    client.invalidateQueries({
      queryKey: workMapPrefix,
      predicate: (query) => {
        const input = query.queryKey[workMapPrefix.length] as { parentGoalId?: string } | undefined;
        return !compareIds(input?.parentGoalId, goalId);
      },
    }),
  ]);
}

export function useDeleteGoal(parentGoalId?: string | null) {
  return useGoalMutation(
    {
      ...Api.goals.deleteMutationOptions(),
      onMutate: () => ({ parentGoalId }),
    },
    (client, { goalId }, _result, context: { parentGoalId?: string | null } | undefined) =>
      invalidateDeletedGoalQueries(client, goalId, context?.parentGoalId),
  );
}
