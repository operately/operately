import Api, * as api from "@/api";
import { assertPresent } from "@/utils/assertions";
import * as Time from "@/utils/time";
export type {
  UseProjectMilestoneOrderingOptions,
  UseProjectMilestoneOrderingResult,
} from "./useProjectMilestoneOrdering";
export { useProjectMilestoneOrdering, __testExports } from "./useProjectMilestoneOrdering";

export type Project = api.Project;
export type ProjectContributor = api.ProjectContributor;
export type Milestone = api.Milestone;
export type ProjectRetrospective = api.ProjectRetrospective;
export type Discussion = api.CommentThread;
export type Resource = api.ProjectKeyResource;
export type ProjectChildrenCount = api.ProjectChildrenCount;

export {
  getProject,
  getProjectRetrospective,
  getProjects,
  useCloseProject,
  useCreateProject,
  useEditProjectName,
  useEditProjectRetrospective,
  useGetProjects,
  useMoveProjectToSpace,
  usePauseProject,
  useRemoveProjectContributor,
  useResumeProject,
  useUpdateProjectContributor,
  useUpdateProjectDescription,
} from "@/api";

export const updateProjectMilestoneOrdering = (
  input: api.ProjectMilestonesUpdateOrderingInput,
) => Api.project_milestones.updateOrdering(input);

export const useUpdateProjectMilestoneOrdering = Api.project_milestones.useUpdateOrdering;

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

export function useContributorSearchFn(project: Project) {
  return async (query: string) => {
    const res = await api.searchProjectContributorCandidates({
      projectId: project.id!,
      query,
    });

    return res.people!.map((p) => p!);
  };
}
