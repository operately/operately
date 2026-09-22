import { useCallback } from "react";
import { useQuerySearch } from "@/models/search/useQuerySearch";
import Api from "@/api";
import { Person, SearchScope } from ".";

interface UseContributorsSearch<T> {
  scope: SearchScope;
  ignoredIds?: string[];
  transformResult?: (person: Person) => T;
}

interface ContributorsSearchParams {
  query?: string;
  ignoredIds?: string[];
}

type ContributorsSearchFn<T> = (callParams: ContributorsSearchParams) => Promise<T[]>;

export function useMentionedPersonSearch<T>(hookParams: UseContributorsSearch<T>): ContributorsSearchFn<T> {
  const search = useQuerySearch(
    (callParams: ContributorsSearchParams) =>
      Api.people.searchQueryOptions({
        query: callParams.query?.trim(),
        ignoredIds: (hookParams.ignoredIds || []).concat(callParams.ignoredIds || []),
        searchScopeType: hookParams.scope.type,
        searchScopeId: hookParams.scope.id,
      }),
    {},
  );

  return useCallback(
    async (callParams: ContributorsSearchParams): Promise<T[]> => {
      const result = await search(callParams);
      const transform = hookParams.transformResult || ((person: Person) => person as unknown as T);
      return (result.people ?? []).filter((person): person is Person => !!person).map(transform);
    },
    [search, hookParams.transformResult],
  );
}
