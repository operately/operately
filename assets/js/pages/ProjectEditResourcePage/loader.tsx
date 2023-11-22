import client from "@/graphql/client";

import * as Pages from "@/components/Pages";
import * as Projects from "@/graphql/Projects";
import * as KeyResources from "@/models/key_resources";

interface LoaderResult {
  project: Projects.Project;
  keyResource: KeyResources.KeyResource;
}

export async function loader({ params }): Promise<LoaderResult> {
  let projectData = await client.query({
    query: Projects.GET_PROJECT,
    variables: { id: params.projectID },
    fetchPolicy: "network-only",
  });

  let keyResourceData = await KeyResources.getKeyResource(params.id);

  return {
    project: projectData.data.project,
    keyResource: keyResourceData.data.keyResource,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
