import * as Pages from "@/components/Pages";

import client from "@/graphql/client";

import * as Projects from "@/graphql/Projects";

interface LoadedData {
  project: Projects.Project;
}

export async function loader({ params }): Promise<LoadedData> {
  let projectData = await client.query({
    query: Projects.GET_PROJECT,
    variables: { id: params.projectID },
    fetchPolicy: "network-only",
  });

  return {
    project: projectData.data.project,
  };
}

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}

export function useRefresh() {
  return Pages.useRefresh();
}
