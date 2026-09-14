import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader({ params }) {
  const queryInput = {
    id: params.goalId,
    includeAccessLevels: true,
    includeSpace: true,
  };
  await Api.goals.getQuery(queryInput);
  return { queryInput };
}

type LoaderInputs = Awaited<ReturnType<typeof loader>>;

export function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<LoaderInputs>();
  const { data } = useLoadedQuery(Api.goals.getQueryOptions(queryInput));

  if (!data?.goal) {
    throw new Error(`Goal data is unavailable for goal "${queryInput.id}"`);
  }
  if (!data.goal.accessLevels) {
    throw new Error(`Goal access levels are unavailable for goal "${queryInput.id}"`);
  }

  return { goal: { ...data.goal, accessLevels: data.goal.accessLevels } };
}
