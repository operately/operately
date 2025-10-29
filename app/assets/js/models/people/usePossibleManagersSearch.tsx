import * as React from "react";

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

  const [people, setPeople] = React.useState<T[]>([]);

  const onSearch = React.useCallback(
    async (query: string) => {
      const res = await Api.listPossibleManagers({
        userId: personId,
        query: query,
      });

      const transform = transformResult || ((person: Person) => person as unknown as T);
      const fetchedPeople = res.people || [];
      const transformedPeople = fetchedPeople
        .filter((person): person is Person => !!person)
        .map((person) => transform(person)) as T[];

      setPeople(transformedPeople);
    },
    [personId, transformResult],
  );

  // Load initial people on mount
  React.useEffect(() => {
    onSearch("");
  }, [onSearch]);

  return { people, onSearch };
}
