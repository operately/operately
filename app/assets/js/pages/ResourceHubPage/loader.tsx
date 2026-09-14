import { useCallback } from "react";
import * as Pages from "@/components/Pages";
import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateResourceHubQueries } from "@/models/resourceHubs/resourceHubLifecycle";

export async function loader({ params }) {
  const hubInput = {
    id: params.id,
    includeGoal: true,
    includeSpace: true,
    includeProject: true,
    includePermissions: true,
    includePotentialSubscribers: true,
  };
  const draftsInput = { resourceHubId: params.id };
  const nodesInput = { resourceHubId: params.id, includeCommentsCount: true, includeChildrenCount: true };

  await Promise.all([
    Api.resource_hubs.getQuery(hubInput),
    Api.resource_hubs.listDraftsQuery(draftsInput),
    Api.resource_hubs.listNodesQuery(nodesInput),
  ]);

  return { hubInput, draftsInput, nodesInput };
}

export function useLoadedData() {
  const inputs = Pages.useLoadedData() as Awaited<ReturnType<typeof loader>>;
  const hub = useLoadedQuery(Api.resource_hubs.getQueryOptions(inputs.hubInput));
  const drafts = useLoadedQuery(Api.resource_hubs.listDraftsQueryOptions(inputs.draftsInput));
  const nodes = useLoadedQuery(Api.resource_hubs.listNodesQueryOptions(inputs.nodesInput));

  if (hub.error || drafts.error || nodes.error) throw hub.error || drafts.error || nodes.error;
  if (!hub.data?.resourceHub || !drafts.data || !nodes.data) throw new Error("Docs & Files data is missing");

  return { resourceHub: hub.data.resourceHub, draftNodes: drafts.data.draftNodes, nodes: nodes.data.nodes };
}

export function useRefresh() {
  const client = useQueryClient();
  return useCallback(() => invalidateResourceHubQueries(client), [client]);
}
