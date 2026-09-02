import Api, { Project } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader({ params }) {
  const queryInput = {
    id: params.projectID,
    includeChampion: true,
    includeReviewer: true,
    includeSpace: true,
    includePotentialSubscribers: true,
  };

  await Api.projects.getQuery(queryInput);

  return { queryInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): { project: Project } {
  const { queryInput } = Pages.useLoadedData<LoaderResult>();
  const { data } = useLoadedQuery(Api.projects.getQueryOptions(queryInput));

  if (!data?.project) {
    throw new Error(`Project data is unavailable for project "${queryInput.id}"`);
  }

  return { project: data.project };
}
