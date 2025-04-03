import * as Pages from "@/components/Pages";
import { getResourceHubDocument, ResourceHubDocument } from "@/models/resourceHubs";

interface LoaderResult {
  document: ResourceHubDocument;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    document: await getResourceHubDocument({
      id: params.id,
      includeSpace: true,
      includeResourceHub: true,
      includeParentFolder: true,
      includePathToDocument: true,
    }).then((res) => res.document!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
