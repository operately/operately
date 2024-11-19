import * as Pages from "@/components/Pages";
import { getResourceHub, ResourceHub } from "@/models/resourceHubs";

interface LoaderResult {
  resourceHub: ResourceHub;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    resourceHub: await getResourceHub({ id: params.id, includeSpace: true }).then((res) => res.resourceHub!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
