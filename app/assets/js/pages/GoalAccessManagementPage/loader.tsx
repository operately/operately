import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as People from "@/models/people";

import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import { compareIds } from "@/routes/paths";

interface LoaderResult {
  goal: Goals.Goal;
  accessMembers: People.Person[];
}

export async function loader({ params }) {
  const queryInput = {
    id: params.goalId,
    includePermissions: true,
    includeAccessLevels: true,
    includeChampion: true,
    includeReviewer: true,
    includeSpace: true,
  };
  const accessMembersInput = { goalId: params.goalId };

  await Promise.all([
    Api.goals.getQuery(queryInput),
    Api.goals.listAccessMembersQuery(accessMembersInput).catch((error) => {
      if (error?.status === 403) {
        throw new Response("Not Found", { status: 404 });
      }
      throw error;
    }),
  ]);

  return { queryInput, accessMembersInput };
}

type LoaderInputs = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): LoaderResult {
  const { queryInput, accessMembersInput } = Pages.useLoadedData<LoaderInputs>();
  const { data: goalData } = useLoadedQuery(Api.goals.getQueryOptions(queryInput));
  const { data: membersData } = useLoadedQuery(Api.goals.listAccessMembersQueryOptions(accessMembersInput));

  if (!goalData?.goal) {
    throw new Error(`Goal data is unavailable for goal "${queryInput.id}"`);
  }

  return { goal: goalData.goal, accessMembers: People.sortByName(membersData?.people ?? []) };
}

export function useBindedPeopleList(): { people: People.Person[] | undefined; loading: boolean } {
  const { goal, accessMembers } = useLoadedData();
  const { data, isLoading } = People.useGetBinded({ resourseType: "goal", resourseId: goal.id });

  if (isLoading) return { people: undefined, loading: true };

  const assignedIds = accessMembers.flatMap((member) => (member.id ? [member.id] : []));
  const people = (data?.people || []).filter((person) => !assignedIds.some((id) => compareIds(id, person.id)));

  return { people, loading: false };
}
