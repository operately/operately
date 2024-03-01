import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";
import * as KeyResources from "@/models/keyResources";

interface LoaderResult {
  project: Projects.Project;
  keyResource: KeyResources.KeyResource;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    project: await Projects.getProject(params.projectID, {
      includeSpace: true,
      includePermissions: true,
    }),
    keyResource: await KeyResources.getKeyResource(params.id),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
