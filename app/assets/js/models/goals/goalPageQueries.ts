import { type QueryClient } from "@tanstack/react-query";
import Api from "@/api";
import { compareIds } from "@/routes/paths";

// Match every include-flag and URL-name variant for the affected goal.
export async function invalidateGoalPageQueries(
  client: QueryClient,
  goalId: string,
  refetchType: "active" | "none" = "active",
): Promise<void> {
  const prefixes = [Api.goals.getQueryKeyPrefix(), Api.goals.countChildrenQueryKeyPrefix()];

  await Promise.all(
    prefixes.map((queryKey) =>
      client.invalidateQueries({
        queryKey,
        refetchType,
        predicate: (query) => {
          // The input object follows the generated endpoint prefix.
          const input = query.queryKey[queryKey.length] as { id?: string } | undefined;
          return compareIds(input?.id, goalId);
        },
      }),
    ),
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
