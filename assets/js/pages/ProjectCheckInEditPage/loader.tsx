import * as Pages from "@/components/Pages";

import * as Projects from "@/models/projects";
import * as ProjectCheckIns from "@/models/projectCheckIns";

interface LoaderResult {
  project: Projects.Project;
  checkIn: ProjectCheckIns.ProjectCheckIn;
}

export async function loader({ params }): Promise<LoaderResult> {
  const projectPromise = Projects.getProject({
    id: params.projectID,
    includePermissions: true,
  });

  const checkInPromise = ProjectCheckIns.getProjectCheckIn({
    id: params.id,
    includeAuthor: true,
    includeReactions: true,
  });

  return {
    project: await projectPromise.then((data) => data.project!),
    checkIn: await checkInPromise.then((data) => data.projectCheckIn!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
