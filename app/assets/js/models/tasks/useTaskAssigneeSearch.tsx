import { useState, useCallback, useEffect } from "react";
import * as Api from "@/api";
import { Person } from "@/api";

interface UseTaskAssigneeSearchParams<T> {
  projectId: string;
  ignoredIds?: (string | null | undefined)[];
  transformResult?: (person: Person) => T;
}

interface SearchData<T> {
  people: T[];
  onSearch: (query: string) => Promise<void>;
}

export function useTaskAssigneeSearch<T>(hookParams: UseTaskAssigneeSearchParams<T>): SearchData<T> {
  const [people, setPeople] = useState<T[]>([]);

  const onSearch = useCallback(
    async (query: string) => {
      const transform = hookParams.transformResult || ((person) => person as unknown as T);

      const ignoredIds = (hookParams.ignoredIds || []).filter((id): id is string => Boolean(id));
      const trimmedQuery = query.trim();

      const result = await Api.listTaskAssignablePeople({
        projectId: hookParams.projectId,
        ignoredIds,
        query: trimmedQuery === "" ? undefined : trimmedQuery,
      });

      const fetchedPeople = result.people || [];
      const transformedPeople = fetchedPeople
        .filter((person): person is Person => !!person)
        .map((person) => transform(person)) as T[];
      setPeople(transformedPeople);
    },
    [hookParams.projectId, hookParams.ignoredIds, hookParams.transformResult],
  );

  // Load initial people on mount
  useEffect(() => {
    onSearch("");
  }, [onSearch]);

  return { people, onSearch };
}
