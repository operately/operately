import * as Pages from "@/components/Pages";
import { files, ResourceHubFile } from "@/models/resourceHubs";

interface LoaderResult {
  file: ResourceHubFile;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    file: await files.get({
      id: params.id,
      includePathToFile: true,
      includeResourceHub: true,
      includeSpace: true,
    }).then((res) => res.file!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
