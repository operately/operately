import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { getGoal } from "@/models/activities";

export async function loader({ params }) {
  const queryInput = { id: params.id };
  await Api.companies.getActivityQuery(queryInput);
  return { queryInput };
}

export function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data } = useLoadedQuery(Api.companies.getActivityQueryOptions(queryInput));

  if (!data?.activity?.commentThread) throw new Error(`Discussion data is unavailable for activity "${queryInput.id}"`);
  const goal = getGoal(data.activity);

  if (!goal?.id) throw new Error(`Goal data is unavailable for activity "${queryInput.id}"`);

  return { activity: data.activity, goal, commentThread: data.activity.commentThread };
}
