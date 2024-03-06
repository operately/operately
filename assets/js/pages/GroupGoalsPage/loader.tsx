import client from "@/graphql/client";

import * as Pages from "@/components/Pages";
import * as Groups from "@/graphql/Groups";
import * as Goals from "@/models/goals";
import * as Projects from "@/models/projects";

import { Group } from "@/gql/generated";

interface LoadedData {
  group: Group;
  goals: Goals.Goal[];
  uncategorizedProjects: Projects.Project[];
}

export async function loader({ params }): Promise<LoadedData> {
  const groupData = await client.query({
    query: Groups.GET_GROUP,
    variables: { id: params.id },
    fetchPolicy: "network-only",
  });

  return {
    goals: await Goals.getGoals({
      spaceId: groupData.data.group.id,
      includeTargets: true,
      includeProjects: true,
    }),
    group: groupData.data.group,
    uncategorizedProjects: await Projects.getProjects({
      spaceId: groupData.data.group.id,
      includeContributors: true,
      includeMilestones: true,
      includeLastCheckIn: true,
      hasNoGoal: true,
    }),
  };
}

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}
