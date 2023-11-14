import * as Pages from "@/components/Pages";

import client from "@/graphql/client";

import * as Projects from "@/graphql/Projects";
import * as Groups from "@/graphql/Groups";

export interface LoaderResult {
  project: Projects.Project;
  groups: Groups.Group[];
}

export async function loader({ params }): Promise<LoaderResult> {
  let projectData = await client.query({
    query: Projects.GET_PROJECT,
    variables: { id: params.projectID },
    fetchPolicy: "network-only",
  });

  const groupData = await client.query({
    query: Groups.LIST_GROUPS,
    fetchPolicy: "network-only",
  });

  return {
    project: projectData.data.project,
    groups: groupData.data.groups,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
