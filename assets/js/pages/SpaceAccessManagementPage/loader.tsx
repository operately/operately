import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";
import * as People from "@/models/people";

import { compareIds } from "@/routes/paths";
import { useGetBindedPeople } from "@/api";
import { assertPresent } from "@/utils/assertions";

interface LoaderResult {
  space: Spaces.Space;
}

export async function loader({ params }): Promise<LoaderResult> {
  const space = await Spaces.getSpace({
    id: params.id,
    includeMembersAccessLevels: true,
    includeAccessLevels: true,
    includePotentialSubscribers: true,
  });

  return { space: space };
}

export function useLoadedData() {
  return Pages.useLoadedData() as LoaderResult;
}

export function useBindedPeopleList(): { people: People.Person[] | undefined; loading: boolean } {
  const { space } = useLoadedData();
  const { data, loading } = useGetBindedPeople({ resourseType: "space", resourseId: space.id! });
  if (loading) return { people: undefined, loading: true };

  assertPresent(space.members, "Space members are required");

  const people = data?.people!.filter((p) => !space.members!.some((m) => compareIds(m.id, p.id)));

  return { people, loading: false };
}
