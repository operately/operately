import { useSearchResults } from "@/models/search/useSearchResults";
import { usePeopleSearchError } from "./usePeopleSearchError";
import Api from "@/api";
import { Person, SearchScope } from ".";

interface UsePeopleSearch<T> {
  scope: SearchScope;
  transformResult?: (person: Person) => T; // transformResult must be memoized
  ignoredIds?: string[]; // ignoredIds must be memoized
}

// This matches PersonField.SearchData from turboui
interface SearchData<T> {
  people: T[];
  onSearch: (query: string) => Promise<void>;
}

export function usePersonFieldSearch<T>(hookParams: UsePeopleSearch<T>): SearchData<T> {
  const search = useSearchResults((query) =>
    Api.people.searchQueryOptions({
      query: query.trim(),
      ignoredIds: (hookParams.ignoredIds || []).filter((id): id is string => Boolean(id)),
      searchScopeType: hookParams.scope.type,
      searchScopeId: hookParams.scope.id,
    }),
  );

  usePeopleSearchError(search);

  const transform = hookParams.transformResult || ((person: Person) => person as unknown as T);
  const people = (search.data?.people ?? []).filter((person): person is Person => !!person).map(transform);

  return { people, onSearch: search.onSearch };
}
