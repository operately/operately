import * as Projects from "@/models/projects";
import * as Milestones from "@/models/milestones";
import * as Pages from "@/components/Pages";

interface LoaderResult {
  project: Projects.Project;
  milestone: Milestones.Milestone;
}

export async function loader({ params }): Promise<LoaderResult> {
  const milestonePromise = Milestones.getMilestone({ id: params.id });
  const projectPromise = Projects.getProject({
    id: params.projectID,
    includeSpace: true,
    includePermissions: true,
  });

  return {
    project: await projectPromise.then((data) => data.project!),
    milestone: await milestonePromise.then((data) => data.milestone!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
