import * as api from "@/api";
import { assertPresent } from "@/utils/assertions";
import * as Time from "@/utils/time";

export type Project = api.Project;
export type ProjectContributor = api.ProjectContributor;
export type Milestone = api.Milestone;
export type ProjectRetrospective = api.ProjectRetrospective;
export type Discussion = api.CommentThread;
export type Resource = api.ProjectKeyResource;

export {
  getProject,
  getProjectRetrospective,
  getProjects,
  useArchiveProject,
  useCloseProject,
  useCreateProject,
  useEditProjectName,
  useEditProjectRetrospective,
  useEditProjectTimeline,
  useGetProjects,
  useMoveProjectToSpace,
  usePauseProject,
  useRemoveProjectContributor,
  useResumeProject,
  useUpdateProjectContributor,
  useUpdateProjectDescription,
} from "@/api";

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

export function isPausable(project: Project) {
  return project.state === "active";
}

export function isResumable(project: Project) {
  return project.state === "paused";
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
