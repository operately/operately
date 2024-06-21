import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";
import * as Spaces from "@/models/spaces";

interface LoaderResult {
  project: Projects.Project;
  spaces: Spaces.Space[];
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    project: await Projects.getProject({
      id: params.projectID,
      includeSpace: true,
      includePermissions: true,
    }).then((data) => data.project!),
    spaces: await Spaces.getSpaces({}),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
