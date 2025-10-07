import Api from "@/api";
import { Person } from ".";

interface UseSpaceMembersSearch<T> {
  spaceId: string;
  ignoredIds?: string[];
  transformResult?: (person: Person) => T;
}

interface SpaceMembersSearchParams {
  query?: string;
  ignoredIds?: string[];
}

type SpaceMembersSearchFn<T> = (params: SpaceMembersSearchParams) => Promise<T[]>;

export function usePersonFieldSpaceMembersSearch<T>(hookParams: UseSpaceMembersSearch<T>): SpaceMembersSearchFn<T> {
  const transform = hookParams.transformResult || ((person) => person as unknown as T);

  return async (callParams: SpaceMembersSearchParams): Promise<T[]> => {
    const ignoredIds = (hookParams.ignoredIds || [])
      .concat(callParams.ignoredIds || [])
      .filter((id): id is string => Boolean(id));
    const query = callParams.query?.trim();

    const result = await Api.spaces.listMembers({
      spaceId: hookParams.spaceId,
      ignoredIds,
      query: query === "" ? undefined : query,
    });

    const people = result.people || [];

    return people.filter((person): person is Person => !!person).map((person) => transform(person)) as T[];
  };
}
