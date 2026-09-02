import Api, * as api from "@/api";
import { assertPresent } from "@/utils/assertions";
import * as Time from "@/utils/time";
import { usePaths } from "@/routes/paths";
import { ProjectField } from "turboui/src/ProjectField";

export { useProjectMilestoneOrdering } from "./useProjectMilestoneOrdering";
export { useTaskStatuses } from "./useTaskStatuses";
export { useProjectContributorActions } from "./useProjectContributorActions";
export { useProjectOtherPeopleWithAccess } from "./useProjectOtherPeopleWithAccess";
export { createSaveProjectAsTemplateHandler, mapScheduleIssue } from "./saveProjectAsTemplate";
export {
  invalidateClosedProjectQueries,
  invalidateProjectLifecycleQueries,
  invalidateProjectRetrospectiveQueries,
  useAcknowledgeProjectRetrospective,
  useCloseProject,
  useEditProjectRetrospective,
  usePauseProject,
  useResumeProject,
} from "./projectLifecycle";
export {
  invalidateProjectDiscussionQueries,
  useCreateProjectDiscussion,
  useUpdateProjectDiscussion,
} from "./projectDiscussionLifecycle";

export type Project = api.Project;
export type Milestone = api.Milestone;
export type ProjectRetrospective = api.ProjectRetrospective;
export type Discussion = api.CommentThread;
export type ProjectChildrenCount = api.ProjectChildrenCount;

export const getProject = Api.projects.get;
export const getProjects = Api.projects.list;
export const useCreateProject = Api.projects.useCreate;

export function isOverdue(project: Pick<Project, "timeframe">) {
  assertPresent(project.timeframe, "project timeline must be defined");

  const deadline = Time.parse(project.timeframe.contextualEndDate?.date);

  return deadline && !Time.isToday(deadline) && Time.isPast(deadline);
}

export function isMilestoneOverdue(milestone: Pick<Milestone, "status" | "timeframe">) {
  if (milestone.status !== "pending") return false;

  const day = Time.parse(milestone.timeframe?.contextualEndDate?.date);
  if (!day) return false;

  return !Time.isToday(day) && Time.isPast(day);
}

interface ProjectSearchAttrs {
  accessLevel?: api.AccessOptions;
  ignoredIds?: string[];
  activeOnly?: boolean;
}

export function useProjectSearch(attrs?: ProjectSearchAttrs): ProjectField.SearchProjectFn {
  const paths = usePaths();

  return async ({ query }: { query: string }): Promise<ProjectField.Project[]> => {
    const data = await Api.projects.search({
      query,
      accessLevel: attrs?.accessLevel,
      ignoredIds: attrs?.ignoredIds || [],
      activeOnly: attrs?.activeOnly,
    });

    return data.projects.flatMap((project) => {
      if (!project.id || !project.name) return [];

      return [
        {
          id: project.id,
          name: project.name,
          link: paths.projectPath(project.id),
        },
      ];
    });
  };
}
