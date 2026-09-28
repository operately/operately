import { useSearchResults } from "@/models/search/useSearchResults";
import { usePeopleSearchError } from "@/models/people/usePeopleSearchError";
import Api, { Person } from "@/api";

interface UseTaskAssigneeSearchParams<T> {
  id: string;
  type: "project" | "space";
  ignoredIds?: (string | null | undefined)[];
  transformResult?: (person: Person) => T;
}

interface SearchData<T> {
  people: T[];
  onSearch: (query: string) => Promise<void>;
}

export function useTaskAssigneeSearch<T>(hookParams: UseTaskAssigneeSearchParams<T>): SearchData<T> {
  const search = useSearchResults((query) =>
    Api.tasks.listPotentialAssigneesQueryOptions({
      id: hookParams.id,
      type: hookParams.type,
      ignoredIds: (hookParams.ignoredIds || []).filter((id): id is string => Boolean(id)),
      query: query.trim() || undefined,
    }),
  );

  usePeopleSearchError(search);

  const transform = hookParams.transformResult || ((person: Person) => person as unknown as T);
  const people = (search.data?.people ?? []).filter((person): person is Person => !!person).map(transform);

  return { people, onSearch: search.onSearch };
}
