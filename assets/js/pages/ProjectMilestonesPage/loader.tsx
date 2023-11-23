import * as Pages from "@/components/Pages";

import client from "@/graphql/client";

import * as Projects from "@/graphql/Projects";
import * as Me from "@/graphql/Me";

interface LoadedData {
  project: Projects.Project;
  me: any;
}

export async function loader({ params }): Promise<LoadedData> {
  let projectData = await client.query({
    query: Projects.GET_PROJECT,
    variables: { id: params.projectID },
    fetchPolicy: "network-only",
  });

  let meData = await client.query({
    query: Me.GET_ME,
  });

  return {
    project: projectData.data.project,
    me: meData.data.me,
  };
}

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}

export function useRefresh() {
  return Pages.useRefresh();
}
