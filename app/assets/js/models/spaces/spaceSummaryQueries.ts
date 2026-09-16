import Api from "@/api";
import { compareIds } from "@/routes/paths";
import { type QueryClient } from "@tanstack/react-query";

type SummaryRefetchType = "active" | "none";

export async function invalidateSpaceSummaryQueries(
  client: QueryClient,
  spaceIds: readonly string[],
  refetchType: SummaryRefetchType = "active",
): Promise<void> {
  if (!spaceIds.length) return;
  const queryKey = Api.spaces.listToolsQueryKeyPrefix();
  await client.invalidateQueries({
    queryKey,
    refetchType,
    predicate: (query) => {
      const input = query.queryKey[queryKey.length] as { spaceId?: string } | undefined;
      return spaceIds.some((id) => compareIds(input?.spaceId, id));
    },
  });
}
