import * as Pages from "@/components/Pages";
import { getResourceHubFolder, ResourceHubFolder } from "@/models/resourceHubs";

interface LoaderResult {
  folder: ResourceHubFolder;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    folder: await getResourceHubFolder({
      id: params.id,
      includeNodes: true,
      includeResourceHub: true,
      includePathToFolder: true,
      includePermissions: true,
      includeChildrenCount: true,
      includePotentialSubscribers: true,
    }).then((res) => res.folder!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
