import * as Pages from "@/components/Pages";
import * as Hub from "@/models/resourceHubs";

interface LoaderResult {
  document: Hub.ResourceHubDocument;
  folder?: Hub.ResourceHubFolder;
  resourceHub: Hub.ResourceHub;
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
  }).then((res) => res.document!);

  const [folder, resourceHub] = await Promise.all([
    document.parentFolderId
      ? Hub.getResourceHubFolder({ id: document.parentFolderId, includePotentialSubscribers: true }).then(
          (res) => res.folder!,
        )
      : undefined,
    Hub.getResourceHub({ id: document.resourceHubId!, includePotentialSubscribers: true }).then(
      (res) => res.resourceHub!,
    ),
  ]);

  return {
    document,
    folder,
    resourceHub,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
