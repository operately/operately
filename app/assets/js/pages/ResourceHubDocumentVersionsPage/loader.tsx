import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { useQueryClient } from "@tanstack/react-query";

export async function loader({ params }) {
  const documentInput = {
    id: params.id,
    includeAuthor: true,
    includePermissions: true,
    includeResourceHub: true,
    includeGoal: true,
    includeSpace: true,
    includeProject: true,
    includePathToDocument: true,
    includePotentialSubscribers: true,
  };
  const versionsInput = { documentId: params.id };
  const [{ document }] = await Promise.all([
    Api.documents.getQuery(documentInput),
    Api.documents.listVersionsQuery(versionsInput),
  ]);

  if (!document?.id) throw new Error("Document data is unavailable");
  if (!document.resourceHubId) throw new Error("Document resource hub is unavailable");

  const hubInput = {
    id: document.resourceHubId,
    includePotentialSubscribers: true,
    includePermissions: true,
    includeGoal: true,
    includeSpace: true,
    includeProject: true,
  };

  await Api.resource_hubs.getQuery(hubInput);

  return { documentInput, hubInput, versionsInput };
}

export function useLoadedData() {
  const { documentInput, hubInput, versionsInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data: documentData } = useLoadedQuery(Api.documents.getQueryOptions(documentInput));
  const { data: hubData } = useLoadedQuery(Api.resource_hubs.getQueryOptions(hubInput));
  const { data: versionsData } = useLoadedQuery(Api.documents.listVersionsQueryOptions(versionsInput));
  const document = documentData?.document;
  const resourceHub = hubData?.resourceHub;

  if (!document?.id) throw new Error("Document data is unavailable");
  if (!resourceHub?.id) throw new Error("Document resource hub is unavailable");
  if (!versionsData) throw new Error("Document versions are unavailable");

  return { document, resourceHub, versions: versionsData.versions ?? [] };
}

export function useRefresh() {
  const client = useQueryClient();
  const { documentInput, hubInput, versionsInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();

  return async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: Api.documents.getQueryKey(documentInput) }),
      client.invalidateQueries({ queryKey: Api.resource_hubs.getQueryKey(hubInput) }),
      client.invalidateQueries({ queryKey: Api.documents.listVersionsQueryKey(versionsInput) }),
    ]);
  };
}
