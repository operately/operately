import * as Page from "@/components/Pages";
import * as Projects from "@/models/projects";
import * as ProjectCheckIns from "@/models/projectCheckIns";

interface LoaderResult {
  project: Projects.Project;
  checkIns: ProjectCheckIns.ProjectCheckIn[];
}

export async function loader({ params }): Promise<LoaderResult> {
  const projectPromise = Projects.getProject({
    id: params.projectID,
    includePermissions: true,
  });

  const checkInsPromise = ProjectCheckIns.getProjectCheckIns({
    projectId: params.projectID,
    includeAuthor: true,
  });

  return {
    project: await projectPromise.then((data) => data.project!),
    checkIns: await checkInsPromise.then((data) => data.projectCheckIns!),
  };
}

export function useLoadedData(): LoaderResult {
  return Page.useLoadedData() as LoaderResult;
}
