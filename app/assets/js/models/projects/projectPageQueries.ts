import { useCallback } from "react";
import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import Api from "@/api";
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
