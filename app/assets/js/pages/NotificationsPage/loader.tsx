import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader() {
  const queryInput = { page: 1, perPage: 100 };
  await Api.notifications.listQuery(queryInput);

  return { queryInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<LoaderResult>();
  const { data } = useLoadedQuery(Api.notifications.listQueryOptions(queryInput));

  if (!data) throw new Error("NotificationsPage data is unavailable");

  return { notifications: data.notifications ?? [] };
}
