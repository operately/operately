import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader({ params }) {
  const queryInput = {
    id: params.goalId,
    includeSpace: true,
    includeReviewer: true,
    includePotentialSubscribers: true,
    includeChecklist: true,
    includeLastCheckIn: true,
  };
  await Api.goals.getQuery(queryInput);

  return { queryInput };
}

export function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data } = useLoadedQuery(Api.goals.getQueryOptions(queryInput));

  if (!data?.goal) throw new Error(`Goal data is unavailable for goal "${queryInput.id}"`);

  return { goal: data.goal };
}
