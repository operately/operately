import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as People from "@/models/people";

import Api, { useGetBindedPeople } from "@/api";
import { compareIds } from "@/routes/paths";

interface LoaderResult {
  goal: Goals.Goal;
  accessMembers: People.Person[];
}

export async function loader({ params }): Promise<LoaderResult> {
  const [goal, accessMembers] = await Promise.all([
    Goals.getGoal({
      id: params.goalId,
      includePermissions: true,
      includeAccessLevels: true,
      includeChampion: true,
      includeReviewer: true,
      includeSpace: true,
    }).then((data) => data.goal),
    Api.goals.listAccessMembers({ goalId: params.goalId }).then((data) => People.sortByName(data.people || [])),
  ]);

  return { goal, accessMembers };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useBindedPeopleList(): { people: People.Person[] | undefined; loading: boolean } {
  const { goal, accessMembers } = useLoadedData();
  const { data, loading } = useGetBindedPeople({ resourseType: "goal", resourseId: goal.id });

  if (loading) return { people: undefined, loading: true };

  const assignedIds = accessMembers.flatMap((member) => (member.id ? [member.id] : []));
  const people = (data?.people || []).filter((person) => !assignedIds.some((id) => compareIds(id, person.id)));

  return { people, loading: false };
}
