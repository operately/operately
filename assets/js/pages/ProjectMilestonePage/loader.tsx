import * as Projects from "@/models/projects";
import * as Milestones from "@/models/milestones";
import * as Pages from "@/components/Pages";

interface LoaderResult {
  project: Projects.Project;
  milestone: Milestones.Milestone;
}

export async function loader({ params }): Promise<LoaderResult> {
  const milestone = await Milestones.getMilestone({ id: params.id }).then((data) => data.milestone!);
  const project = await Projects.getProject({
    id: milestone.projectId,
    includeSpace: true,
    includePermissions: true,
  }).then((data) => data.project!);

  return {
    project: project,
    milestone: milestone,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
