import client from "@/graphql/client";

import * as Pages from "@/components/Pages";
import * as Groups from "@/graphql/Groups";
import * as Companies from "@/models/companies";
import * as Projects from "@/graphql/Projects";

import { Company, Group, Project } from "@/gql/generated";

interface LoadedData {
  company: Company;
  group: Group;
  projects: Project[];
}

export async function loader({ params }): Promise<LoadedData> {
  const groupData = await client.query({
    query: Groups.GET_GROUP,
    variables: { id: params.id },
    fetchPolicy: "network-only",
  });

  const projects = await client.query({
    query: Projects.LIST_PROJECTS,
    variables: { id: params.id },
    fetchPolicy: "network-only",
  });

  return {
    company: await Companies.getCompany(),
    group: groupData.data.group,
    projects: projects.data.projects,
  };
}

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}
