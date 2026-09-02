import Api, { CommentThread } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader({ params }) {
  const queryInput = {
    id: params.id,
    includeUnreadNotifications: true,
    includePermissions: true,
    includeSubscriptionsList: true,
    includePotentialSubscribers: true,
    includeProject: true,
    includeSpace: true,
  };

  await Api.projects.getDiscussionQuery(queryInput);

  return { queryInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): { discussion: CommentThread } {
  const { queryInput } = Pages.useLoadedData<LoaderResult>();
  const { data } = useLoadedQuery(Api.projects.getDiscussionQueryOptions(queryInput));

  if (!data?.discussion) {
    throw new Error(`Discussion data is unavailable for discussion "${queryInput.id}"`);
  }

  return { discussion: data.discussion };
}
