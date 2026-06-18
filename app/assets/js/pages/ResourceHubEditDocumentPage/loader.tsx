import * as Pages from "@/components/Pages";
import { documents, ResourceHubDocument } from "@/models/resourceHubs";

interface LoaderResult {
  document: ResourceHubDocument;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    document: await documents.get({
      id: params.id,
      includeGoal: true,
      includeSpace: true,
      includeProject: true,
      includeResourceHub: true,
      includeParentFolder: true,
      includePathToDocument: true,
      includeSubscriptionsList: true,
      includePotentialSubscribers: true,
    }).then((res) => res.document!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
