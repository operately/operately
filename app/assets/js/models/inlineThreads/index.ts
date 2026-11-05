import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Api, { type ResourceHubDocument } from "@/api";
import { queryClient, useLoadedQuery } from "@/api/queryClient";
import { useMe } from "@/contexts/CurrentCompanyContext";

export { useInlineThreadMutations, invalidateInlineThreadQueries } from "./inlineThreadLifecycle";

export async function prefetchDocumentInlineThreads(document: ResourceHubDocument) {
  if (document.state !== "published") return;

  // Keep failures in the query cache so the comments panel can offer a retry.
  await queryClient
    .fetchQuery({
      ...Api.inline_threads.listQueryOptions({ resourceType: "resource_hub_document", resourceId: document.id }),
      staleTime: 0,
    })
    .catch(() => undefined);
}

export function useDocumentInlineThreads(document: ResourceHubDocument) {
  const me = useMe();
  const client = useQueryClient();

  const enabled = Boolean(document.state === "published" && me);

  const input = { resourceType: "resource_hub_document" as const, resourceId: document.id };
  const query = useLoadedQuery({ ...Api.inline_threads.listQueryOptions(input), enabled, throwOnError: false });
  const threads = query.isError ? [] : (query.data?.threads ?? []);

  // A separately refreshed thread list may be ahead of the displayed document.
  useEffect(() => {
    if (!enabled || !threads.some((thread) => thread.anchor.currentVersion > (document.currentVersion ?? 0))) return;
    void client.invalidateQueries({ queryKey: Api.documents.getQueryKeyPrefix() });
  }, [enabled, query.data, document.currentVersion, client]);

  const reload = () =>
    Promise.all([client.invalidateQueries({ queryKey: Api.documents.getQueryKeyPrefix() }), query.refetch()]);

  return { enabled, input, threads, loading: query.isPending, error: query.isError, reload };
}
