import { invalidateResourceHubInteractionQueries } from "@/models/resourceHubs/resourceHubInteractionQueries";
import { useQueryClient } from "@tanstack/react-query";
import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader({ params }) {
  const linkInput = {
    id: params.id,
    includeAuthor: true,
    includeSubscriptionsList: true,
    includePotentialSubscribers: true,
    includePermissions: true,
    includeReactions: true,
    includePathToLink: true,
    includeResourceHub: true,
    includeGoal: true,
    includeSpace: true,
    includeProject: true,
    includeUnreadNotifications: true,
    includeParentFolder: true,
  };
  const subscriptionInput = { resourceId: params.id, resourceType: "resource_hub_link" as const };

  await Promise.all([Api.links.getQuery(linkInput), Api.notifications.isSubscribedQuery(subscriptionInput)]);

  return { linkInput, subscriptionInput };
}

export function useLoadedData() {
  const { linkInput, subscriptionInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data } = useLoadedQuery(Api.links.getQueryOptions(linkInput));
  const { data: subscriptionData } = useLoadedQuery(Api.notifications.isSubscribedQueryOptions(subscriptionInput));

  const link = data?.link;

  if (!link?.id) throw new Error("Link data is unavailable");
  if (!link.resourceHubId) throw new Error("Link resource hub is unavailable");
  if (!subscriptionData) throw new Error("Link subscription status is unavailable");

  return {
    link: { ...link, resourceHubId: link.resourceHubId },
    isCurrentUserSubscribed: subscriptionData.subscribed,
  };
}

export function useRefresh() {
  const client = useQueryClient();
  const { link } = useLoadedData();

  return () =>
    invalidateResourceHubInteractionQueries(client, {
      id: link.id,
      type: "resource_hub_link",
      resourceHubId: link.resourceHubId,
      parentFolderId: link.parentFolderId,
    });
}
