import * as Pages from "@/components/Pages";
import * as ProjectContributors from "@/models/projectContributors";
import { useNavigateTo } from "@/routes/useNavigateTo";

import { usePaths } from "@/routes/paths";
export interface UrlParams {
  action: "edit-contributor" | "change-champion" | "change-reviewer" | "reassign-as-contributor";
}

export interface LoaderResult {
  contributor: ProjectContributors.ProjectContributor;
  action: UrlParams["action"];
}

export async function loader({ params, request }): Promise<LoaderResult> {
  const contributor = await ProjectContributors.getContributor({
    id: params.id,
    includeProject: true,
    includePermissions: true,
  }).then((data) => data.contributor);

  const action = Pages.getSearchParam(request, "action") as UrlParams["action"];

  if (contributor.permissions?.canEdit || contributor.permissions?.hasFullAccess) {
    return { contributor, action };
  }

  throw new Response("Not Found", { status: 404 });
}

export function useGotoProjectContributors() {
  const paths = usePaths();
  const { contributor } = Pages.useLoadedData() as LoaderResult;
  return useNavigateTo(paths.projectContributorsPath(contributor.project!.id!));
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
