import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader({ params }) {
  const queryInput = {
    id: params.goalId,
    includeChampion: true,
    includeReviewer: true,
  };
  const accessMembersInput = { goalId: params.goalId };
  await Promise.all([Api.goals.getQuery(queryInput), Api.goals.listAccessMembersQuery(accessMembersInput)]);
  return { queryInput, accessMembersInput };
}

type LoaderInputs = Awaited<ReturnType<typeof loader>>;

export function useLoadedData() {
  const { queryInput, accessMembersInput } = Pages.useLoadedData<LoaderInputs>();
  const { data: membersData } = useLoadedQuery(Api.goals.listAccessMembersQueryOptions(accessMembersInput));
  const { data } = useLoadedQuery(Api.goals.getQueryOptions(queryInput));

  if (!data?.goal) {
    throw new Error(`Goal data is unavailable for goal "${queryInput.id}"`);
  }

  return { goal: data.goal, accessMembers: membersData?.people ?? [] };
}
