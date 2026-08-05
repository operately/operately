import * as React from "react";
import { useSearchParams } from "react-router";

import Api, {
  CompaniesSearchInput,
  CompaniesSearchResult,
  SearchResult,
  SearchResultType,
  SearchSort,
  SearchTimeRange,
} from "@/api";
import {
  IconCalendar,
  IconLayoutGrid,
  IconWorld,
  SearchPage,
  SEARCH_TIME_FILTER_OPTIONS,
  SEARCH_TYPE_FILTER_OPTIONS,
} from "turboui";

type Search = (input: CompaniesSearchInput) => Promise<CompaniesSearchResult>;

interface SearchSpaceOption {
  id: string;
  name: string;
}

interface CompanySearchState {
  query: string;
  status: SearchPage.Status;
  results: SearchResult[];
  onQueryChange: (query: string) => void;
  refine: SearchPage.Refine;
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

interface FilterSelections {
  spaces: string[];
  types: string[];
  time: string[];
}

const EMPTY_SELECTIONS: FilterSelections = {
  spaces: [],
  types: [],
  time: [],
};

export function useCompanySearch(
  spaces: SearchSpaceOption[],
  search: Search = Api.companies.search,
): CompanySearchState {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = React.useState(urlQuery);
  const editedQuery = React.useRef<string>();
  const pendingUrlQuery = React.useRef<string>();
  const requests = React.useRef(new SearchRequest());
  const previousRefineKey = React.useRef<string | null>(null);
  const [status, setStatus] = React.useState<SearchPage.Status>("initial");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [sort, setSort] = React.useState<SearchPage.SortMode>("best_match");
  const [selections, setSelections] = React.useState<FilterSelections>(EMPTY_SELECTIONS);

  const refineKey = JSON.stringify({ sort, selections });

  React.useEffect(() => {
    const version = requests.current.begin();
    const normalizedQuery = query.trim();
    const wasEdited = editedQuery.current === query;
    const refineChanged = previousRefineKey.current !== null && previousRefineKey.current !== refineKey;
    editedQuery.current = undefined;
    previousRefineKey.current = refineKey;

    setResults([]);

    if (normalizedQuery.length < 2) {
      setStatus("initial");
      return;
    }

    setStatus("loading");

    const input: CompaniesSearchInput = {
      query: normalizedQuery,
      sort: sort as SearchSort,
      spaceIds: selections.spaces.length > 0 ? selections.spaces : null,
      types: selections.types.length > 0 ? (selections.types as SearchResultType[]) : null,
      timeRange: (selections.time[0] as SearchTimeRange | undefined) ?? null,
    };

    const runSearch = async () => {
      try {
        const response = await search(input);
        if (!requests.current.isCurrent(version)) return;

        setResults(response.results.slice(0, RESULT_LIMIT));
        setStatus("success");
      } catch {
        if (!requests.current.isCurrent(version)) return;

        setStatus("error");
      }
    };

    if (!wasEdited && !refineChanged) {
      runSearch();
      return;
    }

    const timer = window.setTimeout(runSearch, SEARCH_DELAY);
    return () => window.clearTimeout(timer);
  }, [query, refineKey, search, selections.spaces, selections.time, selections.types, sort]);

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

  const onFilterChange = React.useCallback((filterId: string, selectedOptionIds: string[]) => {
    setSelections((current) => ({ ...current, [filterId]: selectedOptionIds }));
  }, []);

  const refine = React.useMemo<SearchPage.Refine>(
    () => ({
      sort,
      onSortChange: setSort,
      filters: [
        {
          id: "spaces",
          label: "All spaces",
          icon: IconWorld,
          selectionMode: "multiple",
          selectedOptionIds: selections.spaces,
          options: spaces.map((space) => ({ id: space.id, label: space.name })),
        },
        {
          id: "types",
          label: "All types",
          icon: IconLayoutGrid,
          selectionMode: "multiple",
          selectedOptionIds: selections.types,
          options: SEARCH_TYPE_FILTER_OPTIONS,
        },
        {
          id: "time",
          label: "All time",
          icon: IconCalendar,
          selectionMode: "single",
          selectedOptionIds: selections.time,
          options: SEARCH_TIME_FILTER_OPTIONS,
        },
      ],
      onFilterChange,
    }),
    [onFilterChange, selections.spaces, selections.time, selections.types, sort, spaces],
  );

  return { query, status, results, onQueryChange, refine };
}
