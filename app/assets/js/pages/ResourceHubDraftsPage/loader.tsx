import * as Pages from "@/components/Pages";

import { resource_hubs, ResourceHub, ResourceHubNode } from "@/models/resourceHubs";

interface LoaderResult {
  resourceHub: ResourceHub;
  draftNodes: ResourceHubNode[];
}

export async function loader({ params }): Promise<LoaderResult> {
  const [resourceHub, nodes] = await Promise.all([
    resource_hubs.get({
      id: params.id,
      includeGoal: true,
      includeSpace: true,
      includeProject: true,
      includePermissions: true,
      includePotentialSubscribers: true,
    }).then((res) => res.resourceHub!),
    resource_hubs.listNodes({
      resourceHubId: params.id,
      includeCommentsCount: true,
    }),
  ]);

  return {
    resourceHub,
    draftNodes: nodes.draftNodes!,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
