import { type QueryClient } from "@tanstack/react-query";
import Api from "@/api";
import { compareIds } from "@/routes/paths";

// Match every include-flag and URL-name variant for the affected goal.
export async function invalidateGoalPageQueries(
  client: QueryClient,
  goalId: string,
  refetchType: "active" | "none" = "active",
): Promise<void> {
  const resources = [
    [Api.goals.getQueryKeyPrefix(), "id"],
    [Api.goals.countChildrenQueryKeyPrefix(), "id"],
    [Api.goals.listCheckInsQueryKeyPrefix(), "goalId"],
    [Api.goals.listDiscussionsQueryKeyPrefix(), "goalId"],
    [Api.companies.getWorkMapQueryKeyPrefix(), "parentGoalId"],
  ] as const;

  await Promise.all(
    resources.map(([queryKey, field]) => invalidateGoalResourceQueries(client, queryKey, field, goalId, refetchType)),
  );
}

// Generated keys append their input object immediately after the endpoint prefix.
export async function invalidateGoalResourceQueries(
  client: QueryClient,
  queryKey: readonly unknown[],
  field: string,
  id: string,
  refetchType: "active" | "none" = "active",
): Promise<void> {
  await client.invalidateQueries({
    queryKey,
    refetchType,
    predicate: (query) => {
      // The query key is an array of strings. The last element is the input object
      const input = query.queryKey[queryKey.length] as Record<string, unknown> | undefined;
      const resourceId = input?.[field];
      return typeof resourceId === "string" && compareIds(resourceId, id);
    },
  });
}

export async function invalidateGoalActivityQueries(
  client: QueryClient,
  activityId: string,
  refetchType: "active" | "none" = "active",
): Promise<void> {
  await invalidateGoalResourceQueries(client, Api.companies.getActivityQueryKeyPrefix(), "id", activityId, refetchType);
}
