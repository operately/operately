import * as Pages from "@/components/Pages";

import { getResourceHub, ResourceHub } from "@/models/resourceHubs";
import { getSpace, Space } from "@/models/spaces";

interface LoaderResult {
  space: Space;
  resourceHub: ResourceHub;
}

export async function loader({ params }): Promise<LoaderResult> {
  const [space, resourceHub] = await Promise.all([
    getSpace({ id: params.spaceId }),
    getResourceHub({ id: params.id }).then((res) => res.resourceHub!),
  ]);

  return { space, resourceHub };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
