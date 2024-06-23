import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";
import * as Goals from "@/models/goals";

interface LoaderResult {
  project: Projects.Project;
  goals: Goals.Goal[];
}

export async function loader({ params }): Promise<LoaderResult> {
  const projectPromise = Projects.getProject({ id: params.projectID, includeGoal: true }).then((data) => data.project!);
  const goalsPromise = Goals.getGoals({ includeSpace: true, includeTargets: true }).then((data) => data.goals!);

  return {
    project: await projectPromise,
    goals: await goalsPromise,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
