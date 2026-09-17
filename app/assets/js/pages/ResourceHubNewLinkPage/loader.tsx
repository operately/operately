import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import type { ResourceHubLinkType } from "turboui";

export async function loader({ params, request }) {
  const url = new URL(request.url);
  const folderId = url.searchParams.get("folderId");
  const hubInput = {
    id: params.id,
    includeGoal: true,
    includeSpace: true,
    includeProject: true,
    includePotentialSubscribers: true,
  };
  const folderInput = folderId ? { id: folderId, includePathToFolder: true } : null;

  await Promise.all([
    Api.resource_hubs.getQuery(hubInput),
    folderInput ? Api.resource_hubs.getFolderQuery(folderInput) : undefined,
  ]);

  return { hubInput, folderInput, linkType: (url.searchParams.get("type") || "other") as ResourceHubLinkType };
}

export function useLoadedData() {
  const { hubInput, folderInput, linkType } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data: hubData } = useLoadedQuery(Api.resource_hubs.getQueryOptions(hubInput));
  const { data: folderData } = useLoadedQuery({
    ...Api.resource_hubs.getFolderQueryOptions(folderInput ?? { id: "" }),
    enabled: folderInput !== null,
  });

  const resourceHub = hubData?.resourceHub;
  const folder = folderInput ? folderData?.folder : undefined;

  if (!resourceHub?.id) throw new Error("Resource hub data is unavailable");
  if (folderInput && !folder?.id) throw new Error("Resource hub folder is unavailable");

  return { resourceHub, folder, linkType };
}
