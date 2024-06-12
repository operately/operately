import client from "@/graphql/client";

import * as Projects from "@/models/projects";
import * as Milestones from "@/models/milestones";
import * as Pages from "@/components/Pages";

interface LoaderResult {
  project: Projects.Project;
  milestone: Milestones.Milestone;
}

export async function loader({ params }): Promise<LoaderResult> {
  let milestoneData = await client.query({
    query: Milestones.GET_MILESTONE,
    variables: { id: params.id },
    fetchPolicy: "network-only",
  });

  return {
    project: await Projects.getProject({
      id: params.projectID,
      includeSpace: true,
      includePermissions: true,
    }),
    milestone: milestoneData.data.milestone,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
