import Api from "@/api";
import { compareIds } from "@/routes/paths";
import { type QueryClient, type QueryKey } from "@tanstack/react-query";

export async function invalidateKpiCommentQueries(
  client: QueryClient,
  context: { entryId: string; kpiId: string; spaceId: string },
  refetchType: "active" | "none" = "active",
) {
  const commentsPrefix = Api.comments.listQueryKeyPrefix();

  function invalidateResource(queryKey: QueryKey, field: string, id: string) {
    return client.invalidateQueries({
      queryKey,
      refetchType,
      predicate: (query) => {
        const input = query.queryKey[queryKey.length] as Record<string, string> | undefined;
        return compareIds(input?.[field], id);
      },
    });
  }

  await Promise.all([
    client.invalidateQueries({
      queryKey: commentsPrefix,
      refetchType,
      predicate: (query) => {
        const input = query.queryKey[commentsPrefix.length] as { entityId?: string; entityType?: string } | undefined;
        return input?.entityType === "kpi_entry" && compareIds(input.entityId, context.entryId);
      },
    }),
    // Detail entries and the list's latest entry both include recorded-update comment counts.
    invalidateResource(Api.kpis.getKpiQueryKeyPrefix(), "kpiId", context.kpiId),
    invalidateResource(Api.kpis.listKpisQueryKeyPrefix(), "spaceId", context.spaceId),
  ]);
}
