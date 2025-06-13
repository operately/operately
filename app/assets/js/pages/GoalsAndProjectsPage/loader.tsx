import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Projects from "@/models/projects";
import { redirectIfFeatureEnabled } from "@/routes/redirectIfFeatureEnabled";

interface LoaderResult {
  goals: Goals.Goal[];
  projects: Projects.Project[];
}

export async function loader({ params }): Promise<LoaderResult> {
  await redirectIfFeatureEnabled(params, {
    feature: "work_map_page",
    path: DeprecatedPaths.workMapPath(),
  });

  const [goals, projects] = await Promise.all([
    Goals.getGoals({
      includeSpace: true,
      includeLastCheckIn: true,
      includeChampion: true,
      includeReviewer: true,
    }).then((data) => data.goals!),
    Projects.getProjects({
      includeGoal: true,
      includeSpace: true,
      includeLastCheckIn: true,
      includeChampion: true,
      includeMilestones: true,
      includePrivacy: true,
      includeReviewer: true,
      includeContributors: true,
      includeRetrospective: true,
    }).then((data) => data.projects!),
  ]);

  return { goals, projects };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
