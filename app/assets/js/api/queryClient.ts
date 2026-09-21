import { reportQueryError } from "./queryErrors";
import {
  QueryClient,
  useQuery,
  type DefaultError,
  type QueryKey,
  type UseQueryOptions,
  type UseQueryResult,
} from "@tanstack/react-query";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      gcTime: FIVE_MINUTES_MS,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: false,
    },
  },
});

// Trigger stale-client toast/reload handling only while a mounted component watches
// the query. Unobserved hover preloads stay silent; their cached errors are reported
// if a component later mounts and starts watching the query.
queryClient.getQueryCache().subscribe(({ query }) => {
  if (query.isActive() && query.state.error) reportQueryError(query.state.error);
});

export function loaderBackedQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> {
  return {
    ...options,
    refetchOnMount: (query) => query.state.isInvalidated,
  };
}

export function useLoadedQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>): UseQueryResult<TData, TError> {
  return useQuery<TQueryFnData, TError, TData, TQueryKey>(loaderBackedQueryOptions(options));
}
