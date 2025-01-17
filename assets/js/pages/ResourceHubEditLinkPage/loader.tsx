import * as Pages from "@/components/Pages";
import { getResourceHubLink, ResourceHubLink } from "@/models/resourceHubs";

interface LoaderResult {
  link: ResourceHubLink;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    link: await getResourceHubLink({
      id: params.id,
      includePathToLink: true,
      includeResourceHub: true,
      includeSpace: true,
    }).then((res) => res.link!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
