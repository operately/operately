import * as Pages from "@/components/Pages";
import * as Hub from "@/models/resourceHubs";
import { isSubscribedToResource } from "@/api";

interface LoaderResult {
  document: Hub.ResourceHubDocument;
  folder?: Hub.ResourceHubFolder;
  resourceHub: Hub.ResourceHub;
  isCurrentUserSubscribed: boolean;
}

export async function loader({ params }): Promise<LoaderResult> {
  const document = await Hub.getResourceHubDocument({
    id: params.id,
    includeAuthor: true,
    includeReactions: true,
    includePermissions: true,
    includePotentialSubscribers: true,
    includeSubscriptionsList: true,
    includeUnreadNotifications: true,
    includePathToDocument: true,
  }).then((res) => res.document);

  const [folder, resourceHub, subscriptionStatus] = await Promise.all([
    document.parentFolderId
      ? Hub.getResourceHubFolder({ id: document.parentFolderId, includePotentialSubscribers: true }).then(
          (res) => res.folder!,
        )
      : undefined,
    Hub.getResourceHub({ id: document.resourceHubId!, includePotentialSubscribers: true }).then(
      (res) => res.resourceHub!,
    ),
    isSubscribedToResource({
      resourceId: document.id,
      resourceType: "resource_hub_document",
    }),
  ]);

  return {
    document,
    folder,
    resourceHub,
    isCurrentUserSubscribed: subscriptionStatus.subscribed,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
