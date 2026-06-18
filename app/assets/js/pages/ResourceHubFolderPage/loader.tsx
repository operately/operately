import * as Pages from "@/components/Pages";
import { folders, resource_hubs, ResourceHubNode, ResourceHubFolder } from "@/models/resourceHubs";

interface LoaderResult {
  folder: ResourceHubFolder;
  nodes: ResourceHubNode[];
  draftNodes: ResourceHubNode[];
}

export async function loader({ params }): Promise<LoaderResult> {
  const [folder, nodes] = await Promise.all([
    folders.get({
      id: params.id,
      includeResourceHub: true,
      includeGoal: true,
      includeSpace: true,
      includeProject: true,
      includePathToFolder: true,
      includePermissions: true,
      includePotentialSubscribers: true,
    }).then((res) => res.folder!),
    resource_hubs.listNodes({
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
