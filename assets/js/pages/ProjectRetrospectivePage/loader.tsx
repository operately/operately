import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";

interface LoaderResult {
  project: Projects.Project;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    project: await Projects.getProject(params.projectID, {
      includeSpace: true,
      includePermissions: true,
      includeRetrospective: true,
      includeClosedBy: true,
    }),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
