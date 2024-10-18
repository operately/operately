import * as Pages from "@/components/Pages";
import * as Goals from "@/models/goals";
import * as Projects from "@/models/projects";

interface LoaderResult {
  goals: Goals.Goal[];
  projects: Projects.Project[];
}

export async function loader(): Promise<LoaderResult> {
  const [goals, projects] = await Promise.all([
    Goals.getGoals({
      includeTargets: true,
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
    }).then((data) => data.projects!),
  ]);

  return { goals, projects };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
