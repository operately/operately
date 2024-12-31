import * as Pages from "@/components/Pages";
import { getResourceHubLink, ResourceHubLink } from "@/models/resourceHubs";

interface LoaderResult {
  link: ResourceHubLink;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    link: await getResourceHubLink({
      id: params.id,
      includeAuthor: true,
      includeSubscriptionsList: true,
      includePotentialSubscribers: true,
      includePermissions: true,
      includeReactions: true,
      includePathToLink: true,
    }).then((res) => res.link!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
