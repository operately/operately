import Api from "@/api";
import { Person, SearchScope } from ".";

interface UsePeopleSearch<T> {
  ignoredIds?: string[];
  scope: SearchScope;
  transformResult?: (people: Person) => T;
}

interface PeopleSearchParams {
  query: string;
  ignoredIds?: string[];
}

type PeopleSearchFn<T> = (callParams: PeopleSearchParams) => Promise<T[]>;

export function usePersonFieldSearch<T>(hookParams: UsePeopleSearch<T>): PeopleSearchFn<T> {
  const transform = hookParams.transformResult || ((person) => person as unknown as T);

  return async (callParams: PeopleSearchParams): Promise<T[]> => {
    const query = callParams.query.trim();
    const ignoredIds = (hookParams.ignoredIds || []).concat(callParams.ignoredIds || []);

    const result = await Api.searchPeople({
      query,
      ignoredIds,
      searchScopeType: hookParams.scope.type,
      searchScopeId: hookParams.scope.id,
    });

    const people = result.people || [];
    return people.map((person) => transform(person!)) as T[];
  };
}
