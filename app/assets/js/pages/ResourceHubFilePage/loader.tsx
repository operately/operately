import * as Pages from "@/components/Pages";
import { getResourceHubFile, ResourceHubFile } from "@/models/resourceHubs";
import { isSubscribedToResource } from "@/models/subscriptions";

interface LoaderResult {
  file: ResourceHubFile;
  isCurrentUserSubscribed: boolean;
}

export async function loader({ params }): Promise<LoaderResult> {
  const [file, subscriptionStatus] = await Promise.all([
    getResourceHubFile({
      id: params.id,
      includeAuthor: true,
      includeResourceHub: true,
      includeParentFolder: true,
      includeReactions: true,
      includePermissions: true,
      includeSubscriptionsList: true,
      includePotentialSubscribers: true,
      includePathToFile: true,
    }).then((res) => res.file),
    isSubscribedToResource({
      resourceId: params.id,
      resourceType: "resource_hub_file",
    }),
  ]);

  return {
    file,
    isCurrentUserSubscribed: subscriptionStatus.subscribed,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
