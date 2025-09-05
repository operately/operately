import * as Milestones from "@/models/milestones";
import * as Pages from "@/components/Pages";

interface LoaderResult {
  milestone: Milestones.Milestone;
}

export async function loader({ params }): Promise<LoaderResult> {
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
