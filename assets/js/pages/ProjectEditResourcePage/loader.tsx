import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";
import * as KeyResources from "@/models/keyResources";

interface LoaderResult {
  project: Projects.Project;
  keyResource: KeyResources.KeyResource;
}

export async function loader({ params }): Promise<LoaderResult> {
  const projectPromise = Projects.getProject({
    id: params.projectID,
    includeSpace: true,
    includePermissions: true,
  }).then((data) => data.project!);

  const resourcePromise = KeyResources.getKeyResource({ id: params.id }).then((d) => d.keyResource!);

  return {
    project: await projectPromise,
    keyResource: await resourcePromise,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
