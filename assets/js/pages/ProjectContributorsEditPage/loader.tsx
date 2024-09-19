import * as Pages from "@/components/Pages";
import * as ProjectContributors from "@/models/projectContributors";
import { Paths } from "@/routes/paths";
import { useNavigateTo } from "@/routes/useNavigateTo";

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
  }).then((data) => data.contributor!);

  const action = Pages.getSearchParam(request, "action") as UrlParams["action"];

  return { contributor: contributor, action: action };
}

export function useGotoProjectContributors() {
  const { contributor } = Pages.useLoadedData() as LoaderResult;
  return useNavigateTo(Paths.projectContributorsPath(contributor.project!.id!));
}
