import * as React from "react";

import type { ResourceHubSearchProps } from "../ResourceHubPage/types";
import type { ResourceHubNode } from "./types";

type SearchStatus = "idle" | "loading" | "success" | "error";

export function useResourceHubSearch(search: ResourceHubSearchProps | undefined) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<ResourceHubNode[]>([]);
  const [status, setStatus] = React.useState<SearchStatus>("idle");
  const requestSequence = React.useRef(0);
  const searchFn = search?.search;
  const normalizedQuery = query.trim();
  const isActive = normalizedQuery.length >= 2;

  React.useEffect(() => {
    const requestId = ++requestSequence.current;

    setResults([]);

    if (!searchFn || !isActive) {
      setStatus("idle");
      return;
    }

    setStatus("loading");

    const timeout = window.setTimeout(async () => {
      try {
        const nextResults = await searchFn({ query: normalizedQuery });

        if (requestSequence.current !== requestId) return;

        setResults(nextResults);
        setStatus("success");
      } catch (_error) {
        if (requestSequence.current !== requestId) return;

        setResults([]);
        setStatus("error");
      }
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [isActive, normalizedQuery, searchFn]);

  return {
    query,
    setQuery,
    results,
    status,
    isActive,
  };
}
