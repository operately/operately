import * as Milestones from "@/models/milestones";
import * as Pages from "@/components/Pages";
import { Paths } from "@/routes/paths";
import { redirectIfFeatureEnabled } from "@/routes/redirectIfFeatureEnabled";

interface LoaderResult {
  milestone: Milestones.Milestone;
}

export async function loader({ params }): Promise<LoaderResult> {
  const paths = new Paths({ companyId: params.companyId });
  await redirectIfFeatureEnabled(params, { feature: "milestone_v2", path: paths.projectMilestoneV2Path(params.id) });

  return {
    milestone: await Milestones.getMilestone({
      id: params.id,
      includeProject: true,
      includeComments: true,
      includePermissions: true,
    }).then((data) => data.milestone!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
