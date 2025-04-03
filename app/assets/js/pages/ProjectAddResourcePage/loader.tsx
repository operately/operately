import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";

import { useSearchParams } from "react-router-dom";

interface LoaderResult {
  project: Projects.Project;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    project: await Projects.getProject({
      id: params.projectID,
      includeSpace: true,
      includePermissions: true,
    }).then((data) => data.project!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useResourceTypeParam() {
  const [searchParams] = useSearchParams();
  const resourceType = searchParams.get("resourceType") || "generic";

  return resourceType;
}
