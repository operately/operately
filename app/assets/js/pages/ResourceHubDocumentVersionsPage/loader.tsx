import * as Pages from "@/components/Pages";
import * as Hub from "@/models/resourceHubs";
import type { DocumentVersion } from "@/api";

interface LoaderResult {
  document: Hub.ResourceHubDocument;
  resourceHub: Hub.ResourceHub;
  versions: DocumentVersion[];
}

export async function loader({ params }): Promise<LoaderResult> {
  const document = await Hub.documents
    .get({
      id: params.id,
      includeAuthor: true,
      includePermissions: true,
      includeResourceHub: true,
      includeGoal: true,
      includeSpace: true,
      includeProject: true,
      includePathToDocument: true,
      includePotentialSubscribers: true,
    })
    .then((res) => res.document!);

  const [resourceHub, versionsResult] = await Promise.all([
    Hub.resource_hubs
      .get({
        id: document.resourceHubId,
        includePotentialSubscribers: true,
        includePermissions: true,
        includeGoal: true,
        includeSpace: true,
        includeProject: true,
      })
      .then((res) => res.resourceHub!),
    Hub.documents.listVersions({ documentId: document.id }),
  ]);

  return {
    document,
    resourceHub,
    versions: versionsResult.versions || [],
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
