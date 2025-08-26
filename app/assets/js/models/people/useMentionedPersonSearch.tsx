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
  const transform = hookParams.transformResult || ((person) => person as unknown as T);

  return async (callParams: ContributorsSearchParams): Promise<T[]> => {
    const ignoredIds = (hookParams.ignoredIds || []).concat(callParams.ignoredIds || []);

    const result = await Api.searchPeople({
      query: callParams.query?.trim(),
      ignoredIds,
      searchScopeType: hookParams.scope.type,
      searchScopeId: hookParams.scope.id,
    });

    const people = result.people || [];

    return people.filter((person): person is Person => !!person).map((person) => transform(person)) as T[];
  };
}
