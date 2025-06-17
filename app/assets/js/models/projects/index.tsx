import * as api from "@/api";
import { assertPresent } from "@/utils/assertions";
import * as Time from "@/utils/time";

export type Project = api.Project;
export type ProjectContributor = api.ProjectContributor;
export type Milestone = api.Milestone;
export type ProjectRetrospective = api.ProjectRetrospective;

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

export function isOverdue(project: Project) {
  assertPresent(project.deadline, "project deadlineAt must be defined");

  const deadline = Time.parse(project.deadline);

  return Time.compareAsc(deadline, Time.today()) === -1;
}

export function isMilestoneOverdue(milestone: Pick<Milestone, "status" | "deadlineAt">) {
  if (milestone.status !== "pending") return false;

  const day = Time.parseDate(milestone.deadlineAt);
  if (!day) return false;

  return !Time.isToday(day) && Time.isPast(day);
}

export function isPausable(project: Project) {
  return project.status === "active";
}

export function isResumable(project: Project) {
  return project.status === "paused";
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
