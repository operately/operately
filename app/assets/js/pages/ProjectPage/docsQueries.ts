import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import type { ResourceHub, ResourceHubNode } from "@/models/resourceHubs";

export type ProjectDocsAndFilesData = {
  resourceHub: ResourceHub;
  nodes: ResourceHubNode[];
  draftNodes: ResourceHubNode[];
};
const EMPTY_NODES: ResourceHubNode[] = [];

export function projectDocsInputs(resourceHubId: string | null | undefined) {
  return {
    enabled: Boolean(resourceHubId),
    hubInput: {
      id: resourceHubId ?? "",
      includeSpace: true,
      includeProject: true,
      includePermissions: true,
      includePotentialSubscribers: true,
    },
    nodesInput: { resourceHubId: resourceHubId ?? "", includeCommentsCount: true, includeChildrenCount: true },
  };
}

export async function prefetchProjectDocs(inputs: ReturnType<typeof projectDocsInputs>) {
  if (!inputs.enabled) return;

  await Promise.all([Api.resource_hubs.getQuery(inputs.hubInput), Api.resource_hubs.listNodesQuery(inputs.nodesInput)]);
}

export function useProjectDocsQueries(resourceHubId: string | null | undefined) {
  const client = useQueryClient();
  const inputs = useMemo(() => projectDocsInputs(resourceHubId), [resourceHubId]);

  const hub = useLoadedQuery({ ...Api.resource_hubs.getQueryOptions(inputs.hubInput), enabled: inputs.enabled });
  const nodes = useLoadedQuery({
    ...Api.resource_hubs.listNodesQueryOptions(inputs.nodesInput),
    enabled: inputs.enabled,
  });

  const data = useMemo<ProjectDocsAndFilesData | null>(() => {
    if (!inputs.enabled || !hub.data?.resourceHub || !nodes.data) return null;
    return {
      resourceHub: hub.data.resourceHub,
      nodes: nodes.data.nodes ?? EMPTY_NODES,
      draftNodes: nodes.data.draftNodes ?? EMPTY_NODES,
    };
  }, [inputs.enabled, hub.data, nodes.data]);

  const refresh = useCallback(async () => {
    if (!inputs.enabled) return;
    await Promise.all([
      client.invalidateQueries({ queryKey: Api.resource_hubs.getQueryKey(inputs.hubInput) }),
      client.invalidateQueries({ queryKey: Api.resource_hubs.listNodesQueryKey(inputs.nodesInput) }),
    ]);
  }, [client, inputs]);

  return {
    data,
    available: inputs.enabled,
    loading: inputs.enabled && !data && (hub.isLoading || nodes.isLoading),
    error: inputs.enabled && (hub.isError || nodes.isError),
    retry: () => {
      void hub.refetch();
      void nodes.refetch();
    },
    refresh,
  };
}
