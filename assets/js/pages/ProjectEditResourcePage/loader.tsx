import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";
import * as KeyResources from "@/models/keyResources";

interface LoaderResult {
  project: Projects.Project;
  keyResource: KeyResources.KeyResource;
}

export async function loader({ params }): Promise<LoaderResult> {
  const resource = await KeyResources.getKeyResource({ id: params.id }).then((d) => d.keyResource!);

  const project = await Projects.getProject({
    id: resource.projectId,
    includeSpace: true,
    includePermissions: true,
  }).then((data) => data.project!);

  return {
    project: project,
    keyResource: resource,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
