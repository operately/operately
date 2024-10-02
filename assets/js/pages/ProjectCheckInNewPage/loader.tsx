import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";

interface LoaderResult {
  project: Projects.Project;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    project: await Projects.getProject({
      id: params.projectID,
      includePotentialSubscribers: true,
    }).then((data) => data.project!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
