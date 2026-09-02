import Api, { ProjectRetrospective } from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader({ params }) {
  const queryInput = {
    projectId: params.projectID,
    includeProject: true,
  };

  await Api.projects.getRetrospectiveQuery(queryInput);

  return { queryInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): { retrospective: ProjectRetrospective } {
  const { queryInput } = Pages.useLoadedData<LoaderResult>();
  const { data } = useLoadedQuery(Api.projects.getRetrospectiveQueryOptions(queryInput));

  if (!data?.retrospective) {
    throw new Error(`Retrospective data is unavailable for project "${queryInput.projectId}"`);
  }

  return { retrospective: data.retrospective };
}
