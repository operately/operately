import * as Pages from "@/components/Pages";
import { getResourceHubFile, ResourceHubFile } from "@/models/resourceHubs";

interface LoaderResult {
  file: ResourceHubFile;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    file: await getResourceHubFile({
      id: params.id,
      includeReactions: true,
      includePermissions: true,
    }).then((res) => res.file!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}