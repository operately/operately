import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";

interface LoadedData {
  project: Projects.Project;
}

export async function loader({ params }): Promise<LoadedData> {
  return {
    project: await Projects.getProject({
      id: params.projectID,
      includeSpace: true,
      includePermissions: true,
      includeMilestones: true,
    }).then((data) => data.project!),
  };
}

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}
