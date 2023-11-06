import client from "@/graphql/client";

import * as Paper from "@/components/PaperContainer";
import * as Projects from "@/graphql/Projects";
import * as Updates from "@/graphql/Projects/updates";

export interface LoaderResult {
  project: Projects.Project;
  updates: Updates.Update[];
}

export async function loader({ params }): Promise<LoaderResult> {
  let projectData = await client.query({
    query: Projects.GET_PROJECT,
    variables: { id: params.projectID },
    fetchPolicy: "network-only",
  });

  let updatesData = await client.query({
    query: Updates.LIST_UPDATES,
    variables: { projectID: params.projectID },
    fetchPolicy: "network-only",
  });

  return {
    project: projectData.data.project,
    updates: updatesData.data.updates,
  };
}

export function useLoadedData(): LoaderResult {
  const [data, _] = Paper.useLoadedData() as [LoaderResult, () => void];

  return data;
}
