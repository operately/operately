import * as Pages from "@/components/Pages";
import * as Discussions from "@/models/discussions";
import { isSubscribedToResource } from "@/models/subscriptions";

interface LoaderResult {
  discussion: Discussions.Discussion;
  isCurrentUserSubscribed: boolean;
}

export async function loader({ params }): Promise<LoaderResult> {
  const [discussion, subscriptionStatus] = await Promise.all([
    Discussions.getDiscussion({
      id: params.id,
      includeAuthor: true,
      includeReactions: true,
      includeSpace: true,
      includeSpaceMembers: true,
      includeSubscriptionsList: true,
      includePotentialSubscribers: true,
      includeUnreadNotifications: true,
      includePermissions: true,
    }).then((d) => d.discussion),
    isSubscribedToResource({
      resourceId: params.id,
      resourceType: "message",
    }),
  ]);

  return {
    discussion,
    isCurrentUserSubscribed: subscriptionStatus.subscribed,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
