import * as Pages from "@/components/Pages";
import * as People from "@/models/people";
import * as ProjectCheckIns from "@/models/projectCheckIns";

interface LoaderResult {
  checkIn: ProjectCheckIns.ProjectCheckIn;
  me: People.Person;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    checkIn: await ProjectCheckIns.getCheckIn(params.id, {
      includeProject: true,
      includeAuthor: true,
      includeReactions: true,
      includeComments: true,
    }),
    me: await People.getMe(),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
