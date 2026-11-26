import { useEffect, useState } from "react";

type Search<T> = (params: { query: string }) => Promise<T[]>;
const emptyResults: never[] = [];

export function useAsyncSearch<T>(search: Search<T>, query: string, enabled: boolean) {
  return useAsyncSearchResults(search, query, enabled) ?? emptyResults;
}

// A null result means the current search is loading.
export function useAsyncSearchResults<T>(search: Search<T>, query: string, enabled: boolean) {
  const [results, setResults] = useState<T[] | null>(null);

  useEffect(() => {
    let current = true;
    setResults(enabled ? null : []);

    if (enabled) {
      search({ query }).then(
        (results) => {
          if (current) setResults(results);
        },
        () => {
          if (current) setResults([]);
        },
      );
    }

    return () => {
      current = false;
    };
  }, [search, query, enabled]);

  return results;
}
