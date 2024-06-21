import * as Page from "@/components/Pages";
import * as Projects from "@/models/projects";
import * as ProjectCheckIns from "@/models/projectCheckIns";

interface LoaderResult {
  project: Projects.Project;
  checkIns: ProjectCheckIns.ProjectCheckIn[];
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    project: await Projects.getProject({
      id: params.projectID,
      includePermissions: true,
    }).then((data) => data.project!),
    checkIns: await ProjectCheckIns.getCheckIns(params.projectID, {
      includeAuthor: true,
    }),
  };
}

export function useLoadedData(): LoaderResult {
  return Page.useLoadedData() as LoaderResult;
}
