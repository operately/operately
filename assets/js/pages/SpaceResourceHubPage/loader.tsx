import * as Pages from "@/components/Pages";

import { listResourceHubContent, ResourceHubNode } from "@/models/resourceHubs";
import { getSpace, Space } from "@/models/spaces";

interface LoaderResult {
  space: Space;
  nodes: ResourceHubNode[];
}

export async function loader({ params }): Promise<LoaderResult> {
  const [space, nodes] = await Promise.all([
    getSpace({ id: params.spaceId }),
    listResourceHubContent({ resourceHubId: params.id }).then((res) => res.nodes!),
  ]);

  return { space, nodes };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
