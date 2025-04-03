import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";

type ContributorTypeParam = "contributor" | "reviewer" | "champion";

export interface UrlParams {
  type: ContributorTypeParam;
}

export interface LoaderResult {
  project: Projects.Project;
  contribType: ContributorTypeParam;
}

export async function loader({ request, params }): Promise<LoaderResult> {
  const project = await Projects.getProject({
    id: params.projectID,
    includeSpace: true,
    includePermissions: true,
  }).then((data) => data.project!);

  const type = Pages.getSearchParam(request, "type") as ContributorTypeParam;

  return { project: project, contribType: type };
}
