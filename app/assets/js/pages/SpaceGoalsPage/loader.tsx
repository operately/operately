import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Projects from "@/models/projects";
import * as Spaces from "@/models/spaces";

import { DeprecatedPaths } from "@/routes/paths";
import { redirectIfFeatureEnabled } from "@/routes/redirectIfFeatureEnabled";

interface LoadedData {
  space: Spaces.Space;
  goals: Goals.Goal[];
  projects: Projects.Project[];
}

export async function loader({ params }): Promise<LoadedData> {
  await redirectIfFeatureEnabled(params, {
    feature: "space_work_map",
    path: DeprecatedPaths.spaceWorkMapPath(params.id),
  });

  const spacePromise = Spaces.getSpace({
    id: params.id,
    includePermissions: true,
  });

  const goalsPromise = Goals.getGoals({
    includeSpace: true,
    includeLastCheckIn: true,
    includeChampion: true,
    includeReviewer: true,
  }).then((data) => data.goals!);

  const projectsPromise = Projects.getProjects({
    includeGoal: true,
    includeSpace: true,
    includeLastCheckIn: true,
    includeChampion: true,
    includeMilestones: true,
    includePrivacy: true,
    includeRetrospective: true,
    includeContributors: true,
  }).then((data) => data.projects!);

  return {
    space: await spacePromise,
    goals: await goalsPromise,
    projects: await projectsPromise,
  };
}

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}
