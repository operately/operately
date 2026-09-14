import * as Pages from "@/components/Pages";
import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";

export async function loader({ params }) {
  const hubInput = {
    id: params.id,
    includeGoal: true,
    includeSpace: true,
    includeProject: true,
    includePermissions: true,
    includePotentialSubscribers: true,
  };
  const draftsInput = { resourceHubId: params.id };

  await Promise.all([Api.resource_hubs.getQuery(hubInput), Api.resource_hubs.listDraftsQuery(draftsInput)]);

  return { hubInput, draftsInput };
}

export function useLoadedData() {
  const inputs = Pages.useLoadedData() as Awaited<ReturnType<typeof loader>>;
  const hub = useLoadedQuery(Api.resource_hubs.getQueryOptions(inputs.hubInput));
  const drafts = useLoadedQuery(Api.resource_hubs.listDraftsQueryOptions(inputs.draftsInput));

  if (hub.error || drafts.error) throw hub.error || drafts.error;
  if (!hub.data?.resourceHub || !drafts.data) throw new Error("Docs & Files data is missing");

  return { resourceHub: hub.data.resourceHub, draftNodes: drafts.data.draftNodes };
}
