import * as Pages from "@/components/Pages";

import * as Projects from "@/models/projects";
import * as ProjectCheckIns from "@/models/projectCheckIns";

interface LoaderResult {
  project: Projects.Project;
  checkIn: ProjectCheckIns.ProjectCheckIn;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    project: await Projects.getProject(params.projectID),
    checkIn: await ProjectCheckIns.getCheckIn(params.id, {
      includeAuthor: true,
      includeReactions: true,
    }),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
