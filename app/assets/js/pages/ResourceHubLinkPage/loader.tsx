import * as Pages from "@/components/Pages";
import { getResourceHubLink, ResourceHubLink } from "@/models/resourceHubs";
import { isSubscribedToResource } from "@/models/subscriptions";

interface LoaderResult {
  link: ResourceHubLink;
  isCurrentUserSubscribed: boolean;
}

export async function loader({ params }): Promise<LoaderResult> {
  const [link, subscriptionStatus] = await Promise.all([
    getResourceHubLink({
      id: params.id,
      includeAuthor: true,
      includeSubscriptionsList: true,
      includePotentialSubscribers: true,
      includePermissions: true,
      includeReactions: true,
      includePathToLink: true,
      includeResourceHub: true,
      includeUnreadNotifications: true,
      includeParentFolder: true,
    }).then((res) => res.link),
    isSubscribedToResource({
      resourceId: params.id,
      resourceType: "resource_hub_link",
    }),
  ]);

  return {
    link,
    isCurrentUserSubscribed: subscriptionStatus.subscribed,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
