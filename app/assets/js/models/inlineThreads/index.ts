import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Api, { type Company, type ResourceHubDocument } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";
import { fetchCompany } from "@/models/companies/companyLayoutQueries";
import { hasFeature } from "@/models/companies/hasFeature";

export { useInlineThreadMutations, invalidateInlineThreadQueries } from "./inlineThreadLifecycle";

function documentInlineThreadsEnabled(company: Company, document: ResourceHubDocument) {
  return document.state === "published" && hasFeature(company, "document_inline_comments");
}

export async function prefetchDocumentInlineThreads(document: ResourceHubDocument) {
  const company = await fetchCompany();

  if (!documentInlineThreadsEnabled(company, document)) return;

  // Keep failures in the query cache so the comments panel can offer a retry.
  await Api.inline_threads
    .listQuery({ resourceType: "resource_hub_document", resourceId: document.id })
    .catch(() => undefined);
}

export function useDocumentInlineThreads(document: ResourceHubDocument) {
  const { company } = useCompanyLoaderData();
  const me = useMe();
  const client = useQueryClient();

  const enabled = Boolean(documentInlineThreadsEnabled(company, document) && me);

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
