import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";

interface LoaderData {
  project: Projects.Project;
}

export async function loader({ params }): Promise<LoaderData> {
  return {
    project: await Projects.getProject({
      id: params.projectID,
      includeSpace: true,
      includeChampion: true,
      includePermissions: true,
      includeContributorsAccessLevels: true,
    }).then((data) => data.project!),
  };
}

export function useLoadedData() {
  return Pages.useLoadedData() as LoaderData;
}

export function useRefresh() {
  return Pages.useRefresh();
}
