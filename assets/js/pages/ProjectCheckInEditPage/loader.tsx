import client from "@/graphql/client";

import * as Pages from "@/components/Pages";

import * as Projects from "@/models/projects";
import * as Updates from "@/graphql/Projects/updates";

interface LoaderResult {
  project: Projects.Project;
  checkIn: Updates.Update;
}

export async function loader({ params }): Promise<LoaderResult> {
  let updateData = await client.query({
    query: Updates.GET_STATUS_UPDATE,
    variables: { id: params.id },
    fetchPolicy: "network-only",
  });

  return {
    project: await Projects.getProject(params.projectID),
    checkIn: updateData.data.update,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
