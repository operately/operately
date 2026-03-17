import * as Pages from "@/components/Pages";
import { LinkOptions } from "@/features/ResourceHub";
import { resource_hubs, folders, ResourceHub, ResourceHubFolder } from "@/models/resourceHubs";

interface LoaderResult {
  resourceHub: ResourceHub;
  folder: ResourceHubFolder | undefined;
  linkType: LinkOptions;
}

export async function loader({ params, request }): Promise<LoaderResult> {
  const url = new URL(request.url);
  const { folderId, type } = Object.fromEntries(url.searchParams.entries());

  const [resourceHub, folder] = await Promise.all([
    resource_hubs.get({
      id: params.id,
      includeSpace: true,
      includePotentialSubscribers: true,
    }).then((res) => res.resourceHub!),
    folderId
      ? folders.get({
          id: folderId,
          includePathToFolder: true,
        }).then((res) => res.folder!)
      : undefined,
  ]);

  return {
    resourceHub,
    folder,
    linkType: (type || "other") as LinkOptions,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
