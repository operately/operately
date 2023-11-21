import client from "@/graphql/client";

import * as Pages from "@/components/Pages";
import * as Projects from "@/graphql/Projects";

import { useSearchParams } from "react-router-dom";

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

export function useResourceTypeParam() {
  const [searchParams] = useSearchParams();
  const resourceType = searchParams.get("resourceType") || "generic";

  return resourceType;
}
