import * as Pages from "@/components/Pages";
import * as Hub from "@/models/resourceHubs";

interface LoaderResult {
  document: Hub.ResourceHubDocument;
  resourceHub?: Hub.ResourceHub;
  folder?: Hub.ResourceHubFolder;
}

export async function loader({ params, request }): Promise<LoaderResult> {
  const url = new URL(request.url);
  const searchParams = Object.fromEntries(url.searchParams.entries());

  if (searchParams.resource_hub) {
    const [resourceHub, document] = await Promise.all([
      Hub.getResourceHub({
        id: searchParams.resource_hub,
        includeNodes: true,
        includePotentialSubscribers: true,
      }).then((res) => res.resourceHub!),
      Hub.getResourceHubDocument({ id: params.id }).then((res) => res.document!),
    ]);

    return { resourceHub, document };
  } else {
    const [folder, document] = await Promise.all([
      Hub.getResourceHubFolder({
        id: searchParams.folder,
        includeNodes: true,
        includePotentialSubscribers: true,
        includePathToFolder: true,
      }).then((res) => res.folder!),
      Hub.getResourceHubDocument({ id: params.id }).then((res) => res.document!),
    ]);

    return { folder, document };
  }
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
