import { useCallback } from "react";
import * as Pages from "@/components/Pages";
import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateResourceHubQueries } from "@/models/resourceHubs/resourceHubLifecycle";

export async function loader({ params }) {
  const folderInput = {
    id: params.id,
    includeResourceHub: true,
    includeGoal: true,
    includeSpace: true,
    includeProject: true,
    includePathToFolder: true,
    includePermissions: true,
    includePotentialSubscribers: true,
  };
  const nodesInput = { folderId: params.id, includeChildrenCount: true, includeCommentsCount: true };
  const [result] = await Promise.all([
    Api.resource_hubs.getFolderQuery(folderInput),
    Api.resource_hubs.listNodesQuery(nodesInput),
  ]);
  const resourceHubId = result.folder?.resourceHub?.id;

  if (!resourceHubId) throw new Error("Folder resource hub is missing");

  const draftsInput = { resourceHubId };
  await Api.resource_hubs.listDraftsQuery(draftsInput);

  return { folderInput, nodesInput, draftsInput };
}

export function useLoadedData() {
  const inputs = Pages.useLoadedData() as Awaited<ReturnType<typeof loader>>;
  const folder = useLoadedQuery(Api.resource_hubs.getFolderQueryOptions(inputs.folderInput));
  const nodes = useLoadedQuery(Api.resource_hubs.listNodesQueryOptions(inputs.nodesInput));
  const drafts = useLoadedQuery(Api.resource_hubs.listDraftsQueryOptions(inputs.draftsInput));

  if (folder.error || nodes.error || drafts.error) throw folder.error || nodes.error || drafts.error;
  if (!folder.data?.folder || !nodes.data || !drafts.data) throw new Error("Folder data is missing");

  return { folder: folder.data.folder, nodes: nodes.data.nodes, draftNodes: drafts.data.draftNodes };
}

export function useRefresh() {
  const client = useQueryClient();
  const { folderInput, draftsInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();

  return useCallback(
    () => invalidateResourceHubQueries(client, { folderId: folderInput.id, resourceHubId: draftsInput.resourceHubId }),
    [client, folderInput.id, draftsInput.resourceHubId],
  );
}
