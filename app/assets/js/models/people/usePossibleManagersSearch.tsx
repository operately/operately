import { useSearchResults } from "@/models/search/useSearchResults";
import { usePeopleSearchError } from "./usePeopleSearchError";

import Api from "@/api";
import { Person } from ".";

interface UsePossibleManagersSearch<T> {
  personId: string;
  transformResult?: (person: Person) => T; // transformResult must be memoized
}

export function usePossibleManagersSearch<T = Person>(
  params: string | UsePossibleManagersSearch<T>,
): { people: T[]; onSearch: (query: string) => Promise<void> } {
  const personId = typeof params === "string" ? params : params.personId;
  const transformResult = typeof params === "string" ? undefined : params.transformResult;

  const search = useSearchResults((query) => Api.people.listPossibleManagersQueryOptions({ userId: personId, query }));
  usePeopleSearchError(search);

  const transform = transformResult || ((person: Person) => person as unknown as T);
  const people = (search.data?.people ?? []).filter((person): person is Person => !!person).map(transform);

  return { people, onSearch: search.onSearch };
}
