import * as Paper from "@/components/PaperContainer";

import client from "@/graphql/client";
import * as Projects from "@/graphql/Projects";

export interface LoaderResult {
  project: Projects.Project;
}

export async function loader({ params }): Promise<LoaderResult> {
  let res = await client.query({
    query: Projects.GET_PROJECT,
    variables: { id: params.projectID },
    fetchPolicy: "network-only",
  });

  return { project: res.data.project };
}

export function useLoadedData(): LoaderResult {
  const [data, _] = Paper.useLoadedData() as [LoaderResult, () => void];

  return data;
}

export function useRefresh() {
  const [_, refresh] = Paper.useLoadedData() as [LoaderResult, () => void];

  return refresh;
}
