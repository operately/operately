import Api from "@/api";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { DISPLAYED_IN_FEED } from "@/features/activities";

type ScopeType = "company" | "project" | "goal" | "space" | "person";

export function useFeedItemsQuery(scopeType: ScopeType, scopeId: string) {
  const input = { scopeType, scopeId, actions: DISPLAYED_IN_FEED, paginate: true };

  const query = useInfiniteQuery({
    // Share endpoint invalidation without sharing ordinary queries' data shape.
    queryKey: [...Api.companies.listActivitiesQueryKey(input), "infinite"],
    queryFn: ({ pageParam }) => Api.companies.listActivities({ ...input, ...(pageParam ? { cursor: pageParam } : {}) }),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => page.nextCursor,
  });

  const data = useMemo(
    () => query.data && { activities: query.data.pages.flatMap((page) => page.activities) },
    [query.data],
  );

  const pages = query.data?.pages ?? [];
  const latestPage = [...pages].reverse().find((page) => page.activities.length > 0);
  const targetActivityId = latestPage?.activities[0]?.id;

  return {
    data,
    loading: query.isLoading,
    error: query.data ? null : query.error,
    refetch: query.refetch,
    pagination: {
      targetActivityId,
      observationKey: `${scopeType}:${scopeId}:${pages.length}:${targetActivityId}:${pages.at(-1)?.nextCursor}`,
      hasNextPage: query.hasNextPage,
      isFetching: query.isFetching,
      isFetchingNextPage: query.isFetchingNextPage,
      hasError: query.isFetchNextPageError,
      onLoadMore: () => query.fetchNextPage({ cancelRefetch: false }),
    },
  };
}
