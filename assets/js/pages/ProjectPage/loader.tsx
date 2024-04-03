import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";

interface LoaderResult {
  project: Projects.Project;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    project: await Projects.getProject({
      id: params.id,
      includeSpace: true,
      includeGoal: true,
      includePermissions: true,
      includeContributors: true,
      includeKeyResources: true,
      includeMilestones: true,
      includeLastCheckIn: true,
    }),
  };
}

export function useLoadedData() {
  return Pages.useLoadedData() as LoaderResult;
}
