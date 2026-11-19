import { invalidateResourceHubInteractionQueries } from "@/models/resourceHubs/resourceHubInteractionQueries";
import Api from "@/api";
import { assertPresent } from "@/utils/assertions";
import { prefetchDocumentInlineThreads } from "@/models/inlineThreads";
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
    includeParentFolder: true,
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

  assertPresent(document.resourceHub, "Document resource hub is unavailable");

  // Load threads before rendering so the document starts with the correct layout.
  await prefetchDocumentInlineThreads(document);

  return { documentInput, subscriptionInput };
}

export function useLoadedData() {
  const { documentInput, subscriptionInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data: documentData } = useLoadedQuery(Api.documents.getQueryOptions(documentInput));
  const { data: subscriptionData } = useLoadedQuery(Api.notifications.isSubscribedQueryOptions(subscriptionInput));

  const document = documentData?.document;
  assertPresent(document, "Document data is unavailable");
  assertPresent(document.resourceHub, "Document resource hub is unavailable");
  if (document.parentFolderId) assertPresent(document.parentFolder, "Document folder is unavailable");
  assertPresent(subscriptionData, "Document subscription status is unavailable");

  return {
    document,
    resourceHub: document.resourceHub,
    folder: document.parentFolder ?? undefined,
    isCurrentUserSubscribed: subscriptionData.subscribed,
  };
}

export function useRefresh() {
  const client = useQueryClient();
  const { document } = useLoadedData();

  return () =>
    invalidateResourceHubInteractionQueries(client, {
      id: document.id,
      type: "resource_hub_document",
      resourceHubId: document.resourceHubId,
      parentFolderId: document.parentFolderId,
    });
}
