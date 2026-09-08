import Api from "@/api";
import { useQuery } from "@tanstack/react-query";
import { DISPLAYED_IN_FEED } from "@/features/activities";

type ScopeType = "company" | "project" | "goal" | "space" | "person";

export function useFeedItemsQuery(scopeType: ScopeType, scopeId: string) {
  const query = useQuery(
    Api.companies.listActivitiesQueryOptions({
      scopeType,
      scopeId,
      actions: DISPLAYED_IN_FEED,
    }),
  );
  return { data: query.data, loading: query.isLoading, error: query.error, refetch: query.refetch };
}
