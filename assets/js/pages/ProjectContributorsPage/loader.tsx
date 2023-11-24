import * as Pages from "@/components/Pages";
import * as Projects from "@/graphql/Projects";

import client from "@/graphql/client";

interface LoaderData {
  project: Projects.Project;
}

export async function loader({ params }): Promise<LoaderData> {
  let projectData = await client.query({
    query: Projects.GET_PROJECT,
    variables: { id: params.projectID },
    fetchPolicy: "network-only",
  });

  return {
    project: projectData.data.project,
  };
}

export function useLoadedData() {
  return Pages.useLoadedData() as LoaderData;
}

export function useRefresh() {
  return Pages.useRefresh();
}
