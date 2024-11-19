import * as Pages from "@/components/Pages";
import { getResourceHubFolder, ResourceHubFolder } from "@/api";

interface LoaderResult {
  folder: ResourceHubFolder;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    folder: await getResourceHubFolder({
      id: params.id,
      includeNodes: true,
      includeResourceHub: true,
    }).then((res) => res.folder!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
