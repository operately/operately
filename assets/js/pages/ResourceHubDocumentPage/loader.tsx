import * as Pages from "@/components/Pages";
import { ResourceHubDocument, getResourceHubDocument } from "@/models/resourceHubs";

interface LoaderResult {
  document: ResourceHubDocument;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    document: await getResourceHubDocument({
      id: params.id,
      includeAuthor: true,
      includeResourceHub: true,
      includeParentFolder: true,
      includeReactions: true,
      includePermissions: true,
      includePotentialSubscribers: true,
      includeSubscriptionsList: true,
      includeUnreadNotifications: true,
      includePathToDocument: true,
    }).then((res) => res.document!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
