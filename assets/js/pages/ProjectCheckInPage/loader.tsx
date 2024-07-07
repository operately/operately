import * as Pages from "@/components/Pages";
import * as ProjectCheckIns from "@/models/projectCheckIns";

interface LoaderResult {
  checkIn: ProjectCheckIns.ProjectCheckIn;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    checkIn: await ProjectCheckIns.getProjectCheckIn({
      id: params.id,
      includeProject: true,
      includeAuthor: true,
      includeReactions: true,
    }).then((data) => data.projectCheckIn!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
