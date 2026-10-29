import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Api, { type ResourceHubDocument } from "@/api";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";

export { useInlineThreadMutations, invalidateInlineThreadQueries } from "./inlineThreadLifecycle";

export function useDocumentInlineThreads(document: ResourceHubDocument) {
  const { company } = useCompanyLoaderData();
  const me = useMe();
  const client = useQueryClient();
  const enabled = Boolean(
    company.enabledExperimentalFeatures?.includes("document_inline_comments") && document.state === "published" && me,
  );
  const input = { resourceType: "resource_hub_document" as const, resourceId: document.id };
  const query = useQuery({ ...Api.inline_threads.listQueryOptions(input), enabled });
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
