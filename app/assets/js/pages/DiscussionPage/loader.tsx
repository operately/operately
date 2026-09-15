import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateDiscussionDetailQueries } from "@/models/discussions/discussionQueries";

export async function loader({ params }) {
  const queryInput = {
    id: params.id,
    includeAuthor: true,
    includeReactions: true,
    includeSpace: true,
    includeSpaceMembers: true,
    includeSubscriptionsList: true,
    includePotentialSubscribers: true,
    includeUnreadNotifications: true,
    includePermissions: true,
  };
  const subscriptionInput = { resourceId: params.id, resourceType: "message" as const };

  await Promise.all([
    Api.spaces.getDiscussionQuery(queryInput),
    Api.notifications.isSubscribedQuery(subscriptionInput),
  ]);

  return { queryInput, subscriptionInput };
}

export function useLoadedData() {
  const { queryInput, subscriptionInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data } = useLoadedQuery(Api.spaces.getDiscussionQueryOptions(queryInput));
  const { data: subscription } = useLoadedQuery(Api.notifications.isSubscribedQueryOptions(subscriptionInput));
  const discussion = data?.discussion;

  if (!discussion?.id) throw new Error(`Discussion data is unavailable for discussion "${queryInput.id}"`);
  if (!discussion.space?.id) throw new Error("Discussion space is unavailable");
  if (!discussion.permissions) throw new Error("Discussion permissions are unavailable");
  if (!subscription) throw new Error("Discussion subscription status is unavailable");

  return {
    discussion: { ...discussion, space: discussion.space, permissions: discussion.permissions },
    isCurrentUserSubscribed: subscription.subscribed,
  };
}

export function useRefresh() {
  const client = useQueryClient();
  const { queryInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();

  return () => invalidateDiscussionDetailQueries(client, queryInput.id);
}
