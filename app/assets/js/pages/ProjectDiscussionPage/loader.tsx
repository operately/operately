import Api, { CommentThread } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { useQueryClient } from "@tanstack/react-query";

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

  const subscriptionInput = {
    resourceId: params.id,
    resourceType: "comment_thread" as const,
  };

  await Promise.all([
    Api.projects.getDiscussionQuery(queryInput),
    Api.notifications.isSubscribedQuery(subscriptionInput),
  ]);

  return { queryInput, subscriptionInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): { discussion: CommentThread; isCurrentUserSubscribed: boolean } {
  const { queryInput, subscriptionInput } = Pages.useLoadedData<LoaderResult>();
  const { data } = useLoadedQuery(Api.projects.getDiscussionQueryOptions(queryInput));
  const { data: subscription } = useLoadedQuery(Api.notifications.isSubscribedQueryOptions(subscriptionInput));

  if (!data?.discussion) {
    throw new Error(`Discussion data is unavailable for discussion "${queryInput.id}"`);
  }

  if (!subscription) {
    throw new Error(`Subscription status is unavailable for discussion "${subscriptionInput.resourceId}"`);
  }

  return {
    discussion: data.discussion,
    isCurrentUserSubscribed: subscription.subscribed,
  };
}

export function useRefresh() {
  const queryClient = useQueryClient();
  const { queryInput, subscriptionInput } = Pages.useLoadedData<LoaderResult>();

  return () => {
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: Api.projects.getDiscussionQueryKey(queryInput) }),
      queryClient.invalidateQueries({ queryKey: Api.notifications.isSubscribedQueryKey(subscriptionInput) }),
    ]);
  };
}
