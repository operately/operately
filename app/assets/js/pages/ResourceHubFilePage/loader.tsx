import { invalidateResourceHubInteractionQueries } from "@/models/resourceHubs/resourceHubInteractionQueries";
import { useQueryClient } from "@tanstack/react-query";
import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader({ params }) {
  const fileInput = {
    id: params.id,
    includeAuthor: true,
    includeResourceHub: true,
    includeGoal: true,
    includeSpace: true,
    includeProject: true,
    includeParentFolder: true,
    includeReactions: true,
    includePermissions: true,
    includeSubscriptionsList: true,
    includePotentialSubscribers: true,
    includePathToFile: true,
  };
  const subscriptionInput = { resourceId: params.id, resourceType: "resource_hub_file" as const };

  await Promise.all([Api.files.getQuery(fileInput), Api.notifications.isSubscribedQuery(subscriptionInput)]);

  return { fileInput, subscriptionInput };
}

export function useLoadedData() {
  const { fileInput, subscriptionInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data } = useLoadedQuery(Api.files.getQueryOptions(fileInput));
  const { data: subscriptionData } = useLoadedQuery(Api.notifications.isSubscribedQueryOptions(subscriptionInput));

  const file = data?.file;

  if (!file?.id) throw new Error("File data is unavailable");
  if (!file.resourceHubId) throw new Error("File resource hub is unavailable");
  if (!subscriptionData) throw new Error("File subscription status is unavailable");

  return {
    file: { ...file, resourceHubId: file.resourceHubId },
    isCurrentUserSubscribed: subscriptionData.subscribed,
  };
}

export function useRefresh() {
  const client = useQueryClient();
  const { file } = useLoadedData();

  return () =>
    invalidateResourceHubInteractionQueries(client, {
      id: file.id,
      type: "resource_hub_file",
      resourceHubId: file.resourceHubId,
      parentFolderId: file.parentFolderId,
    });
}
