import * as Pages from "@/components/Pages";

import * as Projects from "@/models/projects";
import * as ProjectCheckIns from "@/models/projectCheckIns";
import * as People from "@/models/people";

interface LoaderResult {
  me: People.Person;
  project: Projects.Project;
  checkIn: ProjectCheckIns.ProjectCheckIn;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    me: await People.getMe(),
    project: await Projects.getProject({ id: params.projectID }),
    checkIn: await ProjectCheckIns.getCheckIn(params.id, {
      includeAuthor: true,
      includeReactions: true,
    }),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
