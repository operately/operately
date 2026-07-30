import * as React from "react";
import { useSearchParams } from "react-router";

import Api, { CompaniesSearchInput, CompaniesSearchResult, SearchResult } from "@/api";
import { SearchPage } from "turboui";

type Search = (input: CompaniesSearchInput) => Promise<CompaniesSearchResult>;

interface CompanySearchState {
  query: string;
  status: SearchPage.Status;
  results: SearchResult[];
  onQueryChange: (query: string) => void;
}

const SEARCH_DELAY = 300;
const RESULT_LIMIT = 30;

class SearchRequest {
  private version = 0;

  begin(): number {
    this.version += 1;
    return this.version;
  }

  invalidate(): void {
    this.version += 1;
  }

  isCurrent(version: number): boolean {
    return this.version === version;
  }
}

export function useCompanySearch(search: Search = Api.companies.search): CompanySearchState {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = React.useState(urlQuery);
  const editedQuery = React.useRef<string>();
  const pendingUrlQuery = React.useRef<string>();
  const requests = React.useRef(new SearchRequest());
  const [status, setStatus] = React.useState<SearchPage.Status>("initial");
  const [results, setResults] = React.useState<SearchResult[]>([]);

  React.useEffect(() => {
    const version = requests.current.begin();
    const normalizedQuery = query.trim();
    const wasEdited = editedQuery.current === query;
    editedQuery.current = undefined;

    setResults([]);

    if (normalizedQuery.length < 2) {
      setStatus("initial");
      return;
    }

    setStatus("loading");

    const runSearch = async () => {
      try {
        const response = await search({ query: normalizedQuery });
        if (!requests.current.isCurrent(version)) return;

        setResults(response.results.slice(0, RESULT_LIMIT));
        setStatus("success");
      } catch {
        if (!requests.current.isCurrent(version)) return;

        setStatus("error");
      }
    };

    if (!wasEdited) {
      runSearch();
      return;
    }

    const timer = window.setTimeout(runSearch, SEARCH_DELAY);
    return () => window.clearTimeout(timer);
  }, [query, search]);

  // Sync browser-driven URL changes without replaying local edits.
  React.useEffect(() => {
    if (pendingUrlQuery.current !== undefined) {
      if (pendingUrlQuery.current === urlQuery) {
        pendingUrlQuery.current = undefined;
      }
      return;
    }

    if (urlQuery !== query) {
      setQuery(urlQuery);
    }
  }, [query, urlQuery]);

  // Ignore in-flight responses after the page unmounts.
  React.useEffect(() => {
    return () => {
      requests.current.invalidate();
    };
  }, []);

  const onQueryChange = React.useCallback(
    (nextQuery: string) => {
      editedQuery.current = nextQuery;
      pendingUrlQuery.current = nextQuery;
      setQuery(nextQuery);

      const nextParams = new URLSearchParams(searchParams);
      if (nextQuery.length === 0) {
        nextParams.delete("q");
      } else {
        nextParams.set("q", nextQuery);
      }

      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  return { query, status, results, onQueryChange };
}
