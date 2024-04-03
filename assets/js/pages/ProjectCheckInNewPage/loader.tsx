import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";
import * as People from "@/models/people";

interface LoaderResult {
  project: Projects.Project;
  me: People.Person;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    project: await Projects.getProject({ id: params.projectID, includeReviewer: true, includeContributors: true }),
    me: await People.getMe(),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
