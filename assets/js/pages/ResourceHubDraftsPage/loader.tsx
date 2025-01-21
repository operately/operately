import * as Pages from "@/components/Pages";

import { getResourceHub, listResourceHubNodes, ResourceHub, ResourceHubNode } from "@/models/resourceHubs";

interface LoaderResult {
  resourceHub: ResourceHub;
  draftNodes: ResourceHubNode[];
}

export async function loader({ params }): Promise<LoaderResult> {
  const [resourceHub, nodes] = await Promise.all([
    getResourceHub({
      id: params.id,
      includeSpace: true,
      includePermissions: true,
      includePotentialSubscribers: true,
    }).then((res) => res.resourceHub!),
    listResourceHubNodes({
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
