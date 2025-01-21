import * as Pages from "@/components/Pages";
import { getResourceHubFolder, listResourceHubNodes, ResourceHubNode, ResourceHubFolder } from "@/models/resourceHubs";

interface LoaderResult {
  folder: ResourceHubFolder;
  nodes: ResourceHubNode[];
  draftNodes: ResourceHubNode[];
}

export async function loader({ params }): Promise<LoaderResult> {
  const [folder, nodes] = await Promise.all([
    getResourceHubFolder({
      id: params.id,
      includeResourceHub: true,
      includePathToFolder: true,
      includePermissions: true,
      includePotentialSubscribers: true,
    }).then((res) => res.folder!),
    listResourceHubNodes({
      folderId: params.id,
      includeChildrenCount: true,
      includeCommentsCount: true,
    }),
  ]);

  return {
    folder,
    nodes: nodes.nodes!,
    draftNodes: nodes.draftNodes!,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
