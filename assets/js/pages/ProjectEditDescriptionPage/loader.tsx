import client from "@/graphql/client";

import * as Projects from "@/graphql/Projects";
import * as Pages from "@/components/Pages";

interface LoaderResult {
  project: Projects.Project;
}

export async function loader({ params }): Promise<LoaderResult> {
  let projectData = await client.query({
    query: Projects.GET_PROJECT,
    variables: { id: params.projectID },
    fetchPolicy: "network-only",
  });

  return {
    project: projectData.data.project,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
