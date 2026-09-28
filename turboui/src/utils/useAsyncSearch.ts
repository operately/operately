import { useEffect, useState } from "react";

export function useAsyncSearch<T>(
  search: (params: { query: string }) => Promise<T[]>,
  query: string,
  enabled: boolean,
) {
  const [results, setResults] = useState<T[]>([]);

  useEffect(() => {
    let current = true;
    setResults([]);

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
