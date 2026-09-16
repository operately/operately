import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { useQueryClient } from "@tanstack/react-query";

export async function loader({ params }) {
  const documentInput = {
    id: params.id,
    includeAuthor: true,
    includeReactions: true,
    includePermissions: true,
    includePotentialSubscribers: true,
    includeResourceHub: true,
    includeGoal: true,
    includeSpace: true,
    includeProject: true,
    includeSubscriptionsList: true,
    includeUnreadNotifications: true,
    includePathToDocument: true,
  };
  const subscriptionInput = { resourceId: params.id, resourceType: "resource_hub_document" as const };

  const [{ document }] = await Promise.all([
    Api.documents.getQuery(documentInput),
    Api.notifications.isSubscribedQuery(subscriptionInput),
  ]);

  if (!document?.id) throw new Error("Document data is unavailable");
  if (!document.resourceHubId) throw new Error("Document resource hub is unavailable");

  const hubInput = { id: document.resourceHubId, includePotentialSubscribers: true };
  const folderInput = document.parentFolderId
    ? { id: document.parentFolderId, includePotentialSubscribers: true }
    : null;

  await Promise.all([
    Api.resource_hubs.getQuery(hubInput),
    folderInput ? Api.resource_hubs.getFolderQuery(folderInput) : undefined,
  ]);

  return { documentInput, hubInput, folderInput, subscriptionInput };
}

export function useLoadedData() {
  const { documentInput, hubInput, folderInput, subscriptionInput } =
    Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();

  const { data: documentData } = useLoadedQuery(Api.documents.getQueryOptions(documentInput));
  const { data: hubData } = useLoadedQuery(Api.resource_hubs.getQueryOptions(hubInput));
  const { data: folderData } = useLoadedQuery({
    ...Api.resource_hubs.getFolderQueryOptions(folderInput ?? { id: "" }),
    enabled: folderInput !== null,
  });
  const { data: subscriptionData } = useLoadedQuery(Api.notifications.isSubscribedQueryOptions(subscriptionInput));

  const document = documentData?.document;
  const resourceHub = hubData?.resourceHub;
  const folder = folderInput ? folderData?.folder : undefined;

  if (!document?.id) throw new Error("Document data is unavailable");
  if (!resourceHub?.id) throw new Error("Document resource hub is unavailable");
  if (folderInput && !folder?.id) throw new Error("Document folder is unavailable");
  if (!subscriptionData) throw new Error("Document subscription status is unavailable");

  return { document, resourceHub, folder, isCurrentUserSubscribed: subscriptionData.subscribed };
}

export function useRefresh() {
  const client = useQueryClient();
  const { documentInput, hubInput, folderInput, subscriptionInput } =
    Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();

  return async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: Api.documents.getQueryKey(documentInput) }),
      client.invalidateQueries({ queryKey: Api.resource_hubs.getQueryKey(hubInput) }),
      client.invalidateQueries({ queryKey: Api.notifications.isSubscribedQueryKey(subscriptionInput) }),
      ...(folderInput
        ? [client.invalidateQueries({ queryKey: Api.resource_hubs.getFolderQueryKey(folderInput) })]
        : []),
    ]);
  };
}
