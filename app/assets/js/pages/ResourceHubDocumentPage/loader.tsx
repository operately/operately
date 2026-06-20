import * as Pages from "@/components/Pages";
import * as Hub from "@/models/resourceHubs";
import Api from "@/api";

interface LoaderResult {
  document: Hub.ResourceHubDocument;
  folder?: Hub.ResourceHubFolder;
  resourceHub: Hub.ResourceHub;
  isCurrentUserSubscribed: boolean;
}

export async function loader({ params }): Promise<LoaderResult> {
  const document = await Hub.documents.get({
    id: params.id,
    includeAuthor: true,
    includeReactions: true,
    includePermissions: true,
    includePotentialSubscribers: true,
    includeResourceHub: true,
    includeGoal: true,
    includeSpace: true,
    includeProject: true,
    includeSubscriptionsList: true,
    includeUnreadNotifications: true,
    includePathToDocument: true,
  }).then((res) => res.document);

  const [folder, resourceHub, subscriptionStatus] = await Promise.all([
    document.parentFolderId
      ? Hub.folders.get({ id: document.parentFolderId, includePotentialSubscribers: true }).then(
          (res) => res.folder!,
        )
      : undefined,
    Hub.resource_hubs.get({ id: document.resourceHubId!, includePotentialSubscribers: true }).then((res) => res.resourceHub!),
    Api.notifications.isSubscribed({
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
