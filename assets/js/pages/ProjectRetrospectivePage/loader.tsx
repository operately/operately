import * as Pages from "@/components/Pages";
import * as Projects from "@/models/projects";
import * as Comments from "@/models/comments";

interface LoaderResult {
  retrospective: Projects.ProjectRetrospective;
  comments: Comments.Comment[];
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    retrospective: await Projects.getProjectRetrospective({
      projectId: params.projectID,
      includeAuthor: true,
      includeProject: true,
      includePermissions: true,
      includeReactions: true,
    }).then((data) => data.retrospective!),
    comments: await Comments.getComments({
      entityId: params.projectID,
      entityType: "project_retrospective",
    }).then((c) => c.comments!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
