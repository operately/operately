import Api from "@/api";
import * as Pages from "@/components/Pages";
import * as People from "@/models/people";

import { compareIds } from "@/routes/paths";
import { useLoadedQuery } from "@/api/queryClient";

export async function loader({ params }) {
  const queryInput = {
    id: params.id,
    includePermissions: true,
    includeMembersAccessLevels: true,
    includeAccessLevels: true,
    includePotentialSubscribers: true,
  };

  await Api.spaces.getQuery(queryInput);
  return { queryInput };
}

export function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data } = useLoadedQuery(Api.spaces.getQueryOptions(queryInput));
  const space = data?.space;

  if (!space?.id) throw new Error(`Space data is unavailable for space "${queryInput.id}"`);
  if (!space.permissions) throw new Error("Space permissions are unavailable");
  if (!space.accessLevels) throw new Error("Space access levels are unavailable");
  if (!space.members) throw new Error("Space members are unavailable");

  return {
    space: { ...space, permissions: space.permissions, accessLevels: space.accessLevels, members: space.members },
  };
}

export function useBindedPeopleList(): { people: People.Person[] | undefined; loading: boolean } {
  const { space } = useLoadedData();
  const { data, isLoading } = People.useGetBinded({ resourseType: "space", resourseId: space.id });

  if (isLoading) return { people: undefined, loading: true };

  const people = (data?.people ?? []).filter(
    (person) => !space.members.some((member) => compareIds(member.id, person.id)),
  );

  return { people, loading: false };
}
