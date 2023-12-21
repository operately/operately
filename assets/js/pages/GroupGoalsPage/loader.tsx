import client from "@/graphql/client";

import * as Pages from "@/components/Pages";
import * as Groups from "@/graphql/Groups";
import * as Goals from "@/models/goals";
import * as Companies from "@/models/companies";

import { Company, Group } from "@/gql/generated";

interface LoadedData {
  company: Company;
  group: Group;
  goals: Goals.Goal[];
}

export async function loader({ params }): Promise<LoadedData> {
  const groupData = await client.query({
    query: Groups.GET_GROUP,
    variables: { id: params.id },
    fetchPolicy: "network-only",
  });

  return {
    company: await Companies.getCompany(),
    goals: await Goals.getGoals({
      spaceId: groupData.data.group.id,
      includeTargets: true,
    }),
    group: groupData.data.group,
  };
}

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}
