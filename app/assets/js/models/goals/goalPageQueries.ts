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
          // The query key is an array of strings. The last element is the input object.
          const input = query.queryKey[queryKey.length] as { id?: string } | undefined;
          return compareIds(input?.id, goalId);
        },
      }),
    ),
  );
}
