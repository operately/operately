import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader({ params }) {
  const documentInput = {
    id: params.id,
    includeGoal: true,
    includeSpace: true,
    includeProject: true,
    includeResourceHub: true,
    includeParentFolder: true,
    includePathToDocument: true,
    includeAuthor: true,
    includeSubscriptionsList: true,
    includePotentialSubscribers: true,
  };

  await Api.documents.getQuery(documentInput);

  return { documentInput };
}

export function useLoadedData() {
  const { documentInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data } = useLoadedQuery(Api.documents.getQueryOptions(documentInput));
  const document = data?.document;

  if (!document?.id) throw new Error("Document data is unavailable");

  return { document };
}
