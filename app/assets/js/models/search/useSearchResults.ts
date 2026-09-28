import { useCallback, useMemo, useRef, useState } from "react";
import { hashKey, useQuery, useQueryClient, type FetchQueryOptions } from "@tanstack/react-query";

export function useSearchResults<T>(optionsForQuery: (query: string) => FetchQueryOptions<T>) {
  const client = useQueryClient();
  const context = hashKey(optionsForQuery("").queryKey);

  // Generated options encode every request input, including company headers.
  // Equivalent contexts keep the callback stable even when callers recreate arrays.
  const options = useMemo(() => optionsForQuery, [context]);

  const [search, setSearch] = useState({ context, query: "" });
  const query = search.context === context ? search.query : "";
  const currentQuery = useRef(query);
  currentQuery.current = query;

  const result = useQuery({ ...options(query), staleTime: 30_000, retry: false, retryOnMount: false });

  const onSearch = useCallback(
    async (query: string) => {
      setSearch({ context, query });
      // Changing the key starts the observed query. Explicit repeats can retry failures.
      if (query !== currentQuery.current) return;
      try {
        await client.fetchQuery({ ...options(query), staleTime: 30_000, retry: false });
      } catch {
        // The query observer exposes the error to the caller, including initial-load failures.
      }
    },
    [client, context, options],
  );

  return { data: result.data, error: result.error, errorUpdatedAt: result.errorUpdatedAt, onSearch };
}
