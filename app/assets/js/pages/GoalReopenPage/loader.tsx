import Api, { Goal } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader({ params }) {
  const queryInput = {
    id: params.goalId,
    includeSpace: true,
    includeChampion: true,
    includeReviewer: true,
    includePotentialSubscribers: true,
  };

  await Api.goals.getQuery(queryInput);
  return { queryInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): { goal: Goal } {
  const { queryInput } = Pages.useLoadedData<LoaderResult>();
  const { data } = useLoadedQuery(Api.goals.getQueryOptions(queryInput));

  if (!data?.goal) {
    throw new Error(`Goal data is unavailable for goal "${queryInput.id}"`);
  }

  return { goal: data.goal };
}
