import Api, { Project, ProjectsGetInput } from "@/api";
import { queryClient } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { useQuery } from "@tanstack/react-query";

interface LoaderResult {
  queryInput: ProjectsGetInput;
}

export async function loader({ params }): Promise<LoaderResult> {
  const queryInput: ProjectsGetInput = {
    id: params.projectID,
    includeSpace: true,
    includePermissions: true,
    includePotentialSubscribers: true,
  };

  await queryClient.ensureQueryData(Api.projects.getQueryOptions(queryInput));

  return { queryInput };
}

export function useLoadedData(): { project: Project } {
  const { queryInput } = Pages.useLoadedData<LoaderResult>();
  const { data } = useQuery(Api.projects.getQueryOptions(queryInput));

  if (!data?.project) {
    throw new Error(`Project data is unavailable for project "${queryInput.id}"`);
  }

  return { project: data.project };
}
