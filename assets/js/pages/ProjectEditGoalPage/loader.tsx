import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";
import * as Goals from "@/models/goals";

interface LoaderResult {
  project: Projects.Project;
  goals: Goals.Goal[];
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    project: await Projects.getProject({ id: params.projectID, includeGoal: true }).then((data) => data.project!),
    goals: await Goals.getGoals({ includeSpace: true, includeTargets: true }),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
