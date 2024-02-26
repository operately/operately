import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";
import * as Groups from "@/models/groups";

interface LoaderResult {
  project: Projects.Project;
  groups: Groups.Group[];
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    project: await Projects.getProject(params.projectID, {
      includeSpace: true,
      includePermissions: true,
    }),
    groups: await Groups.getGroups(),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
