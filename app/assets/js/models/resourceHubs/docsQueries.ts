import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import type { ResourceHub, ResourceHubNode } from "@/models/resourceHubs";

export type ResourceHubDocsAndFilesData = {
  resourceHub: ResourceHub;
  nodes: ResourceHubNode[];
  draftNodes: ResourceHubNode[];
};
const EMPTY_NODES: ResourceHubNode[] = [];

export function resourceHubDocsInputs(resourceHubId: string | null | undefined) {
  return {
    enabled: Boolean(resourceHubId),
    hubInput: {
      id: resourceHubId ?? "",
      includeSpace: true,
      includeGoal: true,
      includeProject: true,
      includePermissions: true,
      includePotentialSubscribers: true,
    },
    draftsInput: { resourceHubId: resourceHubId ?? "" },
    nodesInput: { resourceHubId: resourceHubId ?? "", includeCommentsCount: true, includeChildrenCount: true },
  };
}

export async function prefetchResourceHubDocs(inputs: ReturnType<typeof resourceHubDocsInputs>) {
  if (!inputs.enabled) return;

  await Promise.all([
    Api.resource_hubs.getQuery(inputs.hubInput),
    Api.resource_hubs.listNodesQuery(inputs.nodesInput),
    Api.resource_hubs.listDraftsQuery(inputs.draftsInput),
  ]);
}

export function useResourceHubDocsQueries(resourceHubId: string | null | undefined) {
  const client = useQueryClient();
  const inputs = useMemo(() => resourceHubDocsInputs(resourceHubId), [resourceHubId]);

  const hub = useLoadedQuery({ ...Api.resource_hubs.getQueryOptions(inputs.hubInput), enabled: inputs.enabled });
  const nodes = useLoadedQuery({
    ...Api.resource_hubs.listNodesQueryOptions(inputs.nodesInput),
    enabled: inputs.enabled,
  });

  const drafts = useLoadedQuery({
    ...Api.resource_hubs.listDraftsQueryOptions(inputs.draftsInput),
    enabled: inputs.enabled,
  });

  const data = useMemo<ResourceHubDocsAndFilesData | null>(() => {
    if (!inputs.enabled || !hub.data?.resourceHub || !nodes.data || !drafts.data) return null;
    return {
      resourceHub: hub.data.resourceHub,
      nodes: nodes.data.nodes ?? EMPTY_NODES,
      draftNodes: drafts.data.draftNodes ?? EMPTY_NODES,
    };
  }, [inputs.enabled, hub.data, nodes.data, drafts.data]);

  const refresh = useCallback(async () => {
    if (!inputs.enabled) return;
    await Promise.all([
      client.invalidateQueries({ queryKey: Api.resource_hubs.getQueryKey(inputs.hubInput) }),
      client.invalidateQueries({ queryKey: Api.resource_hubs.listNodesQueryKey(inputs.nodesInput) }),
      client.invalidateQueries({ queryKey: Api.resource_hubs.listDraftsQueryKey(inputs.draftsInput) }),
    ]);
  }, [client, inputs]);

  return {
    data,
    available: inputs.enabled,
    loading: inputs.enabled && !data && (hub.isLoading || nodes.isLoading || drafts.isLoading),
    error: inputs.enabled && (hub.isError || nodes.isError || drafts.isError),
    retry: () => {
      void hub.refetch();
      void nodes.refetch();
      void drafts.refetch();
    },
    refresh,
  };
}
