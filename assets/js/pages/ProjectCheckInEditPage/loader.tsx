import * as Pages from "@/components/Pages";
import * as ProjectCheckIns from "@/models/projectCheckIns";

interface LoaderResult {
  checkIn: ProjectCheckIns.ProjectCheckIn;
}

export async function loader({ params }): Promise<LoaderResult> {
  const checkInPromise = ProjectCheckIns.getProjectCheckIn({
    id: params.id,
    includeAuthor: true,
    includeProject: true,
    includeReactions: true,
  });

  return {
    checkIn: await checkInPromise.then((data) => data.projectCheckIn!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
