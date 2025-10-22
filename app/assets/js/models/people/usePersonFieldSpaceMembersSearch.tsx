import { useState, useEffect, useCallback } from "react";
import Api from "@/api";
import { Person } from ".";

interface UseSpaceMembersSearch<T> {
  spaceId: string;
  transformResult?: (person: Person) => T; // transformResult must be memoized
  ignoredIds?: string[]; // ignoredIds must be memoized
}

// This matches PersonField.SearchData from turboui
interface SearchData<T> {
  people: T[];
  onSearch: (query: string) => Promise<void>;
}

export function usePersonFieldSpaceMembersSearch<T>(hookParams: UseSpaceMembersSearch<T>): SearchData<T> {
  const [people, setPeople] = useState<T[]>([]);

  const onSearch = useCallback(
    async (query: string) => {
      const transform = hookParams.transformResult || ((person) => person as unknown as T)

      const ignoredIds = (hookParams.ignoredIds || [])
        .filter((id): id is string => Boolean(id));
      const trimmedQuery = query.trim();

      const result = await Api.spaces.listMembers({
        spaceId: hookParams.spaceId,
        ignoredIds,
        query: trimmedQuery === "" ? undefined : trimmedQuery,
      });

      const fetchedPeople = result.people || [];
      const transformedPeople = fetchedPeople.filter((person): person is Person => !!person).map((person) => transform(person)) as T[];
      setPeople(transformedPeople);
    },
    [hookParams.spaceId, hookParams.ignoredIds, hookParams.transformResult],
  );

  // Load initial people on mount
  useEffect(() => {
    onSearch("");
  }, [onSearch]);

  return { people, onSearch };
}
