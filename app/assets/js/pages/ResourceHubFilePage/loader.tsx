import * as Pages from "@/components/Pages";
import { getResourceHubFile, ResourceHubFile } from "@/models/resourceHubs";

interface LoaderResult {
  file: ResourceHubFile;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    file: await getResourceHubFile({
      id: params.id,
      includeAuthor: true,
      includeResourceHub: true,
      includeParentFolder: true,
      includeReactions: true,
      includePermissions: true,
      includeSubscriptionsList: true,
      includePotentialSubscribers: true,
      includePathToFile: true,
    }).then((res) => res.file!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
